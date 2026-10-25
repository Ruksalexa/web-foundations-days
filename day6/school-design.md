# School Database Design

This database keeps track of students, the courses they take, and the grades they get.

## Tables

### students

Stores one row for each student.

- `id`: the primary key, a unique number for each student.
- `name`: the student's full name (required).
- `email`: the student's email (required and unique, so two students cannot share one).

### courses

Stores one row for each course.

- `id`: the primary key.
- `title`: the name of the course (required).
- `teacher`: the name of the teacher (required).

### enrolments

Stores one row each time a student joins a course.

- `id`: the primary key.
- `student_id`: a foreign key pointing to `students(id)`.
- `course_id`: a foreign key pointing to `courses(id)`.
- `grade`: the student's grade on that course. It can be empty until a grade is given.
- A `UNIQUE (student_id, course_id)` rule stops the same student enrolling on the same course twice.

## Relationships

- **One-to-many:** one student can have many enrolments, and one course can have many enrolments. But each enrolment belongs to exactly one student and exactly one course.
- **Many-to-many:** students and courses are in a many-to-many relationship. One student can take many courses, and one course can have many students.
- **Why a join table is needed:** a single table cannot store a many-to-many relationship properly. We would have to repeat student details on every row or squeeze several courses into one cell. The `enrolments` table solves this by holding one row for each student and course pair. It also gives us a place to store the grade, which belongs to the pair and not to the student or the course alone.

## SQL or NoSQL?

I would choose SQL for this system. The data is structured and has clear relationships between students, courses and enrolments, and SQL handles this well with foreign keys and joins. Rules like unique emails and no duplicate enrolments can be enforced by the database itself, which keeps the data correct. A school also needs queries that combine tables, such as listing the students on a course or finding students with no enrolments, and these are natural in SQL. NoSQL would be a better choice if the data had no fixed shape or needed to scale across many servers, but neither applies to a school.
