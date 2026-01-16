from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional, List
from datetime import datetime

# Step 1: Role Enum (API level)
class UserRole(str, Enum):
    student = "student"
    ta = "ta"
    teacher = "teacher"
    hod = "hod"
    admin = "admin"

# Step 2: User Create Schema (Register ke liye)
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.student

# Step 3: User Out Schema (Response ke liye)
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Course schemas
class CourseBase(BaseModel):
    name: str
    description: str
    instructor_id: Optional[int] = None
    schedule: Optional[str] = None
    credits: int = 3
    semester: Optional[str] = None
    room: Optional[str] = None
    max_students: int = 30
    is_active: bool = True

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int
    created_at: datetime
    instructor: Optional[UserOut] = None

    class Config:
        from_attributes = True

# Assignment schemas
class AssignmentBase(BaseModel):
    title: str
    description: str
    course_id: int
    due_date: Optional[datetime] = None
    max_points: int = 100

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentOut(AssignmentBase):
    id: int
    created_by_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Submission schemas
class SubmissionBase(BaseModel):
    content: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    assignment_id: Optional[int] = None
    course_id: int

class SubmissionOut(SubmissionBase):
    id: int
    assignment_id: Optional[int]
    course_id: int
    student_id: int
    submitted_at: datetime
    is_late: bool
    status: str
    teacher_notes: Optional[str] = None
    checked_at: Optional[datetime] = None
    student: Optional[UserOut] = None

    class Config:
        from_attributes = True

# Review schemas (TA reviews)
class ReviewBase(BaseModel):
    comments: Optional[str] = None
    recommendations: Optional[str] = None
    flagged_issues: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewOut(ReviewBase):
    id: int
    submission_id: int
    reviewer_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Grade schemas
class GradeBase(BaseModel):
    points_earned: int
    feedback: Optional[str] = None

class GradeCreate(GradeBase):
    submission_id: int

class GradeOut(GradeBase):
    id: int
    submission_id: int
    student_id: int
    grader_id: int
    graded_at: datetime
    is_final: bool

    class Config:
        from_attributes = True

# Attendance schemas
class AttendanceBase(BaseModel):
    student_id: int
    course_id: int
    date: str
    status: str  # Present / Absent

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceOut(AttendanceBase):
    id: int

    class Config:
        from_attributes = True

# Booking schemas
class BookingBase(BaseModel):
    resource_name: str
    user_id: int
    date: str

class BookingCreate(BookingBase):
    pass

class BookingOut(BookingBase):
    id: int

    class Config:
        from_attributes = True

class BookingStatusUpdate(BaseModel):
    status: str   # e.g., "approved", "rejected", "pending"

# Report schemas
class ReportBase(BaseModel):
    title: str
    content: str

class ReportCreate(ReportBase):
    pass

class ReportOut(ReportBase):
    id: int

    class Config:
        from_attributes = True