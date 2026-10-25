-- School database
PRAGMA foreign_keys = ON;

-- ---------- Tables ----------

CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    teacher TEXT NOT NULL
);

CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);

-- ---------- Sample data ----------

INSERT INTO students (name, email) VALUES ('Amina Otieno', 'amina@example.com');
INSERT INTO students (name, email) VALUES ('Brian Kamau', 'brian@example.com');
INSERT INTO students (name, email) VALUES ('Cynthia Wanjiru', 'cynthia@example.com');
INSERT INTO students (name, email) VALUES ('David Mwangi', 'david@example.com');

INSERT INTO courses (title, teacher) VALUES ('Web Development', 'Ms Njeri');
INSERT INTO courses (title, teacher) VALUES ('Databases', 'Mr Ochieng');
INSERT INTO courses (title, teacher) VALUES ('Mathematics', 'Mrs Achieng');

INSERT INTO enrolments (student_id, course_id, grade) VALUES (1, 1, 'A');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (1, 2, 'B');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (2, 1, 'B');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (2, 3, 'C');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (3, 2, 'A');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (3, 1, 'B');

-- ---------- Queries ----------

-- 1. All courses for one student (by name)
SELECT courses.title, enrolments.grade
FROM students
JOIN enrolments ON students.id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.id
WHERE students.name = 'Amina Otieno';

-- 2. All students on one course
SELECT students.name, students.email
FROM courses
JOIN enrolments ON courses.id = enrolments.course_id
JOIN students ON enrolments.student_id = students.id
WHERE courses.title = 'Web Development';

-- 3. The number of students per course
SELECT courses.title, COUNT(enrolments.id) AS number_of_students
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.id;

-- 4. Students who have no enrolments
SELECT students.name
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.id IS NULL;

-- 5. Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE student_id = 2 AND course_id = 1;

-- Check the update worked
SELECT * FROM enrolments WHERE student_id = 2 AND course_id = 1;