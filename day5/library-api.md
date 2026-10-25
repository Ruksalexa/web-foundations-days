# Library API Design

This is a REST API design for a library's **books** resource. All paths start with `/books`, and data is sent and received as JSON.

## Endpoints

### 1. List all books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all the books in the library.
- **Request body:** none
- **Success status code:** 200 OK

### 2. Get one book

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns the book with the given id.
- **Request body:** none
- **Success status code:** 200 OK

### 3. Create a book

- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958
  }
  ```
- **Success status code:** 201 Created

### 4. Update a book

- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces the details of an existing book.
- **Example request body:**
  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1959
  }
  ```
- **Success status code:** 200 OK

### 5. Delete a book

- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Removes the book with the given id.
- **Request body:** none
- **Success status code:** 204 No Content

### 6. List books by an author

- **Method:** GET
- **Path:** `/books?author=Chinua Achebe`
- **Description:** Returns only the books written by the author given in the query parameter.
- **Request body:** none
- **Success status code:** 200 OK

## Error codes

### 400 Bad Request

- The request is wrong or incomplete.
- **Example:** a POST to `/books` where the `title` is missing or empty.

### 404 Not Found

- The thing that was asked for does not exist.
- **Example:** a GET to `/books/999` when there is no book with id 999.
