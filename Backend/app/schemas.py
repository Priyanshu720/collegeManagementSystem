from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional
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
    email: EmailStr                # NEW
    password: str
    role: UserRole = UserRole.student   # NEW (default Student)

# Step 3: User Out Schema (Response ke liye)
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr                # NEW
    role: UserRole                 # NEW

    class Config:
        orm_mode = True   # (FastAPI ORM objects ko convert karega)





# Course schemas
class CourseBase(BaseModel):
    name: str
    code: str
    description: str

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int

    class Config:
        orm_mode = True


# Assignment schemas
class AssignmentBase(BaseModel):
    title: str
    description: str
    course_id: int

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentOut(AssignmentBase):
    id: int

    class Config:
        orm_mode = True





# (Pydantic v2 ke liye)

class SubmissionCreate(BaseModel):
    content: str   # Student apna answer / link submit karega
    submitted_at: datetime = datetime.utcnow()

class SubmissionOut(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    content: str
    submitted_at: datetime

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
        orm_mode = True


#booking schemas
class BookingBase(BaseModel):
    resource_name: str
    user_id: int
    date: str

class BookingCreate(BookingBase):
    pass

class BookingOut(BookingBase):
    id: int

    class Config:
        orm_mode = True
class BookingStatusUpdate(BaseModel):
    status: str   # e.g., "approved", "rejected", "pending"


#report schemas
class ReportBase(BaseModel):
    title: str
    content: str

class ReportCreate(ReportBase):
    pass

class ReportOut(ReportBase):
    id: int

    class Config:
        orm_mode = True