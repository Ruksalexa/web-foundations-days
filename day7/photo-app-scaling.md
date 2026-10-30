# SnapShare Scaling Plan

SnapShare is a photo-sharing app. Users upload photos and scroll a feed of photos from the people they follow. This plan estimates the load and designs a system that can handle it.

## 1. Assumptions

- 10 million registered users.
- 10% of users are active each day.
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- An average photo is 2 MB, and each photo also gets a 50 KB thumbnail.
- There are 86,400 seconds in a day and 365 days in a year.
- Peak traffic is 5 times the average.
- 1 MB = 1,000,000 bytes, to keep the maths simple.

**Daily active users (DAU):** 10,000,000 x 10% = **1,000,000 users per day**

## 2. Estimates

### Uploads per second

- Uploads per day: 1,000,000 users x 1 photo = 1,000,000 photos
- Average: 1,000,000 / 86,400 = about **12 uploads per second**
- Peak (5x): about **58 uploads per second**

### Feed views per second

- Feed views per day: 1,000,000 users x 50 views = 50,000,000 views
- Average: 50,000,000 / 86,400 = about **579 views per second**
- Peak (5x): 579 x 5 = about **2,900 views per second**

### Storage per year

- Original photos per day: 1,000,000 x 2 MB = 2,000,000 MB = 2 TB
- Original photos per year: 2 TB x 365 = **730 TB**
- Thumbnails per day: 1,000,000 x 50 KB = 50 GB
- Thumbnails per year: 50 GB x 365 = about **18 TB**
- Total per year: about **748 TB** (roughly 0.75 PB)

## 3. Read-heavy or write-heavy?

SnapShare is **read-heavy**. There are 50 million feed views per day but only 1 million uploads, so reads outnumber writes by about 50 to 1.

What this means for the design:

- Make reads fast and cheap, using a cache, a CDN and a database read replica.
- Writes are fewer, so one primary database can handle them for a long time.
- Heavy work such as making thumbnails should be moved out of the upload request so uploads stay quick.

## 4. Where to store the photos

Photos should **not** be stored inside the database. At about 750 TB a year, the database would become huge, slow and very expensive to back up. Every photo download would also use up database capacity that should be used for queries.

Photos should go in **object storage** instead. It is built to store huge numbers of large files cheaply, it scales almost without limit, and it works well with a CDN. The database stores only the photo's details (id, owner, caption, time) and the URL of the file in object storage.

## 5. Architecture diagram

## 6. What each component does

- **CDN:** delivers photos and thumbnails from servers close to the user, which makes images load faster and takes load off our own servers.
- **Load balancer:** shares incoming requests across many app servers so no single server is overwhelmed, and keeps the app running if one server fails.
- **App servers:** run the application logic (login, upload, feed) and can be added in numbers to handle more traffic.
- **Cache:** keeps frequently requested data, such as feeds, in fast memory so the database does not have to answer the same question again and again.
- **Database (primary):** stores the structured data (users, follows, photo details) reliably and handles all the writes.
- **Read replica:** a copy of the database that answers read queries, which spreads the heavy read load away from the primary.
- **Object storage:** stores the large photo files cheaply and with almost unlimited space, so the database does not have to.
- **Queue:** holds thumbnail jobs so the upload can finish straight away without waiting for the slow work.
- **Worker:** takes jobs from the queue and creates the thumbnails in the background.

## 7. Upload flow, step by step

1. The user picks a photo in the app and sends the upload request.
2. The load balancer receives the request and passes it to one of the app servers.
3. The app server checks that the user is logged in and that the file is valid (the right type and a sensible size).
4. The app server saves the original photo in object storage.
5. The app server writes a row to the primary database with the photo id, owner, storage URL, time and a status of "processing".
6. The app server puts a message on the queue: "create a thumbnail for photo X".
7. The app server replies to the user with "upload successful". The user does not wait for the thumbnail.
8. A worker takes the message from the queue, downloads the original photo and creates a 50 KB thumbnail.
9. The worker saves the thumbnail in object storage and updates the database row with the thumbnail URL and a status of "ready".
10. When followers open their feed, the app server reads the feed from the cache or the read replica, and the images are delivered through the CDN.

## 8. Trade-offs

- **Cache speed vs fresh data:** the cache makes feeds fast, but it can show slightly old data. A new photo may take a few seconds to appear in a follower's feed. We accept this because a tiny delay does not matter much in a photo feed, and the speed gain is large.
