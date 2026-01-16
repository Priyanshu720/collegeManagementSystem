from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime


# Step 1: Role Enum
class UserRole(str, enum.Enum):
    student = "student"
    ta = "ta"
    teacher = "teacher"
    hod = "hod"
    admin = "admin"


# Step 2: User Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("Enrollment", back_populates="user")
    assignments_created = relationship("Assignment", back_populates="created_by")
    submissions = relationship("Submission", back_populates="student")
    grades = relationship("Grade", back_populates="student", foreign_keys="[Grade.student_id]")
    grades_given = relationship("Grade", back_populates="grader", foreign_keys="[Grade.grader_id]")


# Step 3: Course Model
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    schedule = Column(String, nullable=True)  # e.g., "Mon, Wed, Fri 10:00-11:00"
    credits = Column(Integer, default=3)
    semester = Column(String, nullable=True)  # e.g., "Fall 2024"
    room = Column(String, nullable=True)  # e.g., "Room 101"
    max_students = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("Enrollment", back_populates="course")
    assignments = relationship("Assignment", back_populates="course")
    instructor = relationship("User", foreign_keys=[instructor_id])


# Step 4: Enrollment (Many-to-Many relation between User and Course)
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


# Step 5: Assignment Model
class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    due_date = Column(DateTime, nullable=True)
    max_points = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="assignments")
    created_by = relationship("User", back_populates="assignments_created")
    submissions = relationship("Submission", back_populates="assignment")


# Step 6: Submission Model
class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_type = Column(String, nullable=True)  # pdf, image, etc.
    submitted_at = Column(DateTime, default=datetime.utcnow)
    is_late = Column(Boolean, default=False)
    status = Column(String, default="pending")  # pending, checked, graded
    teacher_notes = Column(Text, nullable=True)
    checked_at = Column(DateTime, nullable=True)
    checked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
    course = relationship("Course", foreign_keys=[course_id])
    checked_by = relationship("User", foreign_keys=[checked_by_id])
    grades = relationship("Grade", back_populates="submission")
    reviews = relationship("Review", back_populates="submission")


# Step 7: Review Model (TA reviews)
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    comments = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    flagged_issues = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])


# Step 8: Grade Model
class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    grader_id = Column(Integer, ForeignKey("users.id"))
    points_earned = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    graded_at = Column(DateTime, default=datetime.utcnow)
    is_final = Column(Boolean, default=False)

    submission = relationship("Submission", back_populates="grades")
    student = relationship("User", back_populates="grades", foreign_keys=[student_id])
    grader = relationship("User", back_populates="grades_given", foreign_keys=[grader_id])


# Step 9: Attendance Model
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    date = Column(String, nullable=False)
    status = Column(String, nullable=False)  # Present/Absent

    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])


# Step 10: Booking Model
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    resource_name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected

    user = relationship("User", foreign_keys=[user_id])


# Step 11: Report Model
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)