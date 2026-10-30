# TicketHub Design Document

TicketHub is a website that sells tickets for concerts and events. This document follows the six-part framework: requirements, estimates, API, data model, architecture and trade-offs. It also explains how the design stops two people from buying the same seat.

## 1. Requirements

### Functional requirements

- Users can register and log in.
- Users can browse events and see the details of one event.
- Users can see which seats are available for an event.
- Users can hold seats for a short time (5 minutes) while they pay.
- Users can pay for the seats they are holding.
- Users receive their tickets by email and can view them on the website.

### Non-functional requirements

- **Speed:** event pages load in under 1 second. Holding a seat answers in under 500 milliseconds, even during a big sale.
- **Correctness:** a seat is never sold to two people, and a user is never charged without getting a ticket.
- **Fairness:** during a big sale, people are served in the order they arrived, and one person or bot cannot grab all the seats.
- **Availability:** the site must stay up during a big sale, because that is when it matters most.
- **Security:** all traffic uses HTTPS and passwords are hashed. We do not store card details, because a payment provider handles them.

## 2. Estimates

### Assumptions

- 2 million registered users.
- On a normal day, 50,000 people visit and each views 10 pages.
- On a normal day, 5,000 tickets are sold.
- Peak traffic on a normal day is 5 times the average.
- During a big sale, 200,000 people try to buy 20,000 seats in the first 10 minutes (600 seconds). We assume each person views about 10 pages in that time.
- There are 86,400 seconds in a day.

### Normal traffic

- Page views per day: 50,000 x 10 = 500,000
- Average: 500,000 / 86,400 = about **6 page views per second**
- Peak (5x): about **29 page views per second**
- Tickets sold: 5,000 / 86,400 = about **0.06 per second** (one every 17 seconds)
- Peak (5x): about **0.3 per second** (one every 3 seconds)

### Big sale traffic

- People arriving: 200,000 / 600 = about **333 people per second**
- Page views: 200,000 x 10 = 2,000,000 in 600 seconds = about **3,333 page views per second**
- Seats sold if all 20,000 sell evenly: 20,000 / 600 = about **33 purchases per second**
- At least 333 seat-hold attempts per second, but only about 33 per second can succeed. About 9 out of every 10 people will not get a seat.

### Comparison

|                       | Normal average | Normal peak | Big sale |
| --------------------- | -------------- | ----------- | -------- |
| Page views per second | 6              | 29          | 3,333    |
| Purchases per second  | 0.06           | 0.3         | 33       |

The big sale is about **575 times** busier than a normal day on average, and about 115 times busier than a normal peak. On a normal day the system is read-heavy (about 100 views for every sale). In a big sale, thousands of people fight over the same 20,000 seats at the same moment, so the main problem is many people trying to change the same data at once. The traffic also arrives in a spike, and it will probably be heaviest in the first minute, so the system has to be ready before the sale starts.

## 3. API

All paths start with `/api/v1`. Every request except browsing needs a token in the header: `Authorization: Bearer <token>`.

| Method | Path                 | Description                                              | Success status |
| ------ | -------------------- | -------------------------------------------------------- | -------------- |
| GET    | `/events`            | Browse the list of events                                | 200 OK         |
| GET    | `/events/{id}`       | View the details of one event                            | 200 OK         |
| GET    | `/events/{id}/seats` | View the seats of an event and whether each is available | 200 OK         |
| POST   | `/events/{id}/holds` | Hold one or more seats for 5 minutes                     | 201 Created    |
| POST   | `/orders`            | Pay for the seats the user is holding                    | 201 Created    |
| GET    | `/tickets`           | View the logged-in user's tickets                        | 200 OK         |

### Example: hold seats

**Request:** `POST /api/v1/events/12/holds`

```json
{
  "seat_ids": [301, 302]
}
```

**Response:** `201 Created`

```json
{
  "held_seats": [301, 302],
  "expires_at": "2026-11-20T18:05:00Z"
}
```

### Example: pay

**Request:** `POST /api/v1/orders`

```json
{
  "event_id": 12,
  "seat_ids": [301, 302],
  "payment_token": "tok_abc123"
}
```

**Response:** `201 Created`

```json
{
  "order_id": 880,
  "status": "paid",
  "tickets": [301, 302]
}
```

### Errors

| Status                | When it happens                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| 400 Bad Request       | The request is wrong, for example no seats were chosen, or more than 4 seats |
| 401 Unauthorized      | The user is not logged in                                                    |
| 404 Not Found         | The event does not exist                                                     |
| 409 Conflict          | A seat has already been held or sold by someone else                         |
| 410 Gone              | The user's hold expired before they paid                                     |
| 402 Payment Required  | The payment was declined                                                     |
| 429 Too Many Requests | The user is sending too many requests, or must wait in the queue             |

## 4. Data model

### Tables

**users:** `id` (primary key), `name`, `email` (unique), `password_hash`, `created_at`

**events:** `id` (primary key), `name`, `venue`, `event_date`, `on_sale_time`

**seats:** `id` (primary key), `event_id` (foreign key to events), `label` (such as "A12"), `price`, `status` ("available", "held" or "sold"), `held_by` (foreign key to users, can be empty), `hold_expires_at` (can be empty)

**orders:** `id` (primary key), `user_id` (foreign key to users), `total_amount`, `status`, `created_at`

**tickets:** `id` (primary key), `order_id` (foreign key to orders), `seat_id` (foreign key to seats, **unique**)

### Relationships

- One user has many orders (one-to-many).
- One event has many seats (one-to-many).
- One order has many tickets (one-to-many).
- One seat has at most one ticket (one-to-one). This is enforced by the `UNIQUE` rule on `tickets.seat_id`.
- Users and seats are linked in two ways. A user can temporarily hold seats (`held_by`), and a user ends up owning a seat through an order and its tickets.

### CREATE TABLE statements

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    venue TEXT NOT NULL,
    event_date TEXT NOT NULL,
    on_sale_time TEXT NOT NULL
);

CREATE TABLE seats (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    held_by INTEGER,
    hold_expires_at TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (held_by) REFERENCES users(id)
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE tickets (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);
```

## 5. How the design prevents two people buying the same seat

The danger is that two people click the same seat at the same moment, and both are told "yes". We stop this with three layers.

**Layer 1: an atomic hold.** When a user holds a seat, the app runs one single UPDATE statement that checks and changes the seat at the same time:

```sql
UPDATE seats
SET status = 'held', held_by = 5, hold_expires_at = '2026-11-20T18:05:00Z'
WHERE id = 301
  AND (status = 'available' OR (status = 'held' AND hold_expires_at < '2026-11-20T18:00:00Z'));
```

The database locks the seat row while it runs this, so two requests for the same seat are handled one after the other. The first one finds the seat available and changes it. The second one finds it already held, so the WHERE clause matches nothing and **0 rows are changed**. The app sees "0 rows changed" and returns **409 Conflict**. Because the check and the change happen in one step, there is no gap in which two people can both succeed. The `OR` part lets a seat with an expired hold be taken again, so seats are never locked forever.

**Layer 2: a transaction when paying.** When a user pays, the app starts a database **transaction** and does everything as one unit:

1. Check that the seats are still held by this user and the hold has not expired.
2. Take the payment.
3. Mark the seats as "sold".
4. Create the order and the tickets.

If any step fails, the whole transaction is rolled back, so the user is never charged without getting a ticket, and the seat is not left half-sold.

**Layer 3: a constraint as a safety net.** The `UNIQUE` rule on `tickets.seat_id` means the database itself refuses to create a second ticket for the same seat. Even if there were a bug in the app code, the second insert would fail instead of double-booking.

**The cache is never trusted for this.** The cache only helps to show the seat map quickly, so it may be a second or two out of date. The real decision is always made in the primary database.

## 6. Architecture

### Diagram

```
          +----------------------+
          |  Client (browser or  |
          |      phone app)      |
          +----------------------+
                |           |
                v           |
            +-------+       |
            |  DNS  |       |
            +-------+       |
                |           |
                v           v
          +---------+  +--------------------------+
          |   CDN   |  |  Waiting Room + Rate     |
          | (pages, |  |  Limiter (big sales)     |
          |  images)|  +--------------------------+
          +---------+               |
                                    v
                          +-----------------+
                          |  Load Balancer  |
                          +-----------------+
                           |      |       |
                           v      v       v
                        +-----+ +-----+ +-----+
                        | App | | App | | App |  (many, added
                        | Srv | | Srv | | Srv |   before a sale)
                        +-----+ +-----+ +-----+
                           |      |       |
        +------------------+      |       +------------------+
        |                         |                          |
        v                         v                          v
    +-------+          +------------------+           +-----------+
    | Cache |          | Primary Database |           |  Payment  |
    +-------+          |  (seats, orders) |           |  Provider |
                       +------------------+           +-----------+
                              |
                              | copies data
                              v
                       +--------------+          +---------+     +--------+
                       | Read Replica |          |  Queue  |---->| Worker |
                       +--------------+          +---------+     +--------+
```

The app servers also put jobs on the queue (such as "email this ticket") after a purchase.

### What each component does

- **Client:** the browser or phone app where the user browses events and buys tickets.
- **DNS:** turns the website name into the address of our servers so users can find us.
- **CDN:** delivers the pages, images and event details from servers near the user, so most of the big-sale traffic never reaches our servers.
- **Waiting room and rate limiter:** during a big sale, lets people in a few at a time in the order they arrived and blocks bots, so the system is not crushed by everyone at once.
- **Load balancer:** shares requests across the app servers so none is overwhelmed and traffic keeps flowing if one fails.
- **App servers:** run the API code (browse, hold, pay) and many extra ones are started before a big sale to handle the load.
- **Cache:** keeps event details and the seat map in fast memory, so thousands of people looking at the seats do not hit the database.
- **Primary database:** stores the seats, orders and tickets, and makes the final decision on every hold and purchase, which prevents double-booking.
- **Read replica:** a copy of the database that answers browsing queries, which keeps the primary free for the important writes.
- **Payment provider:** an outside service that takes the card payment securely, so we never store card details.
- **Queue:** holds slow jobs, such as sending ticket emails, so that paying finishes quickly.
- **Worker:** takes jobs from the queue and does them in the background, including sending emails and releasing expired holds.

### How it survives the big sale

- **Before the sale:** we start extra app servers ahead of time, because starting them during the spike is too slow.
- **The CDN** serves the event page, images and scripts, so only the real actions (seat map, hold, pay) reach our servers.
- **The waiting room** controls how many people are inside at once. With 333 people arriving every second but only about 33 purchases per second possible, letting everyone in at once would just cause errors. Letting in a limited number keeps every request fast, and it is fair because the order is first come, first served.
- **The cache** answers seat map reads, so only the hold and pay requests go to the primary database.
- **Each hold is one small update** on one row, so the primary database can handle 33 or more of them per second easily.
- **The queue** moves emails out of the payment path, so paying stays fast.
- **Rate limiting** stops bots and stops one person from sending hundreds of requests.

## 7. Trade-offs

- **Waiting room: fairness and safety vs convenience.** People have to wait their turn instead of going straight to the seats. This is annoying, but it keeps the site working and treats everyone fairly. Without it, the site would likely crash and nobody would get tickets.
- **Cache: speed vs fresh data.** The seat map in the cache can be a second or two old, so a user might click a seat that has just been taken and get a 409 error. We accept this because it keeps the database free for the real work, and the database still makes the final decision, so no seat is ever double-booked.
- **Hold time: fairness to buyers vs fairness to others.** A 5-minute hold gives people time to pay, but while a seat is held nobody else can buy it. A longer hold would help slow payers, but it would lock seats away from other people. Five minutes is a balance.
- **One primary database: correctness vs scaling.** All seat changes go through one primary database, which keeps the data correct but limits how many writes can happen. At about 33 purchases per second this is not a problem. We protect it by keeping each write small and by using the waiting room.

## 8. Avoiding single points of failure

- We run many app servers behind a load balancer, and the load balancer itself is a pair.
- The read replica can be promoted to primary if the primary fails, and we take regular backups.
- The cache runs on more than one machine, and if it fails the app can still read from the database, just more slowly.
- The queue stores jobs safely, so none are lost, and we run more than one worker.
