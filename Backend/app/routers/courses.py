from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

routers = APIRouter()

# GET courses enrolled by the current student
@routers.get("/my", response_model=List[schemas.CourseOut])
async def get_my_courses(
    current_user=Depends(role_required([schemas.UserRole.student])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Course)
        .join(models.Enrollment)
        .where(models.Enrollment.user_id == current_user.id)
    )
    courses = result.scalars().all()
    return courses

# GET all courses
@routers.get("/", response_model=List[schemas.CourseOut])
async def get_courses(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course))
    courses = result.scalars().all()
    return courses

# GET course by ID
@routers.get("/{course_id}", response_model=schemas.CourseOut)
async def get_course(course_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course).where(models.Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

# POST create course (Teacher/Admin)
@routers.post("/", response_model=schemas.CourseOut)
async def create_course(course: schemas.CourseCreate, user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    new_course = models.Course(**course.dict())
    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)
    return new_course

# PUT update course (Teacher/Admin)
@routers.put("/{course_id}", response_model=schemas.CourseOut)
async def update_course(course_id: int, course: schemas.CourseCreate, user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course).where(models.Course.id == course_id))
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, value in course.dict().items():
        setattr(existing, key, value)
    await db.commit()
    await db.refresh(existing)
    return existing

# DELETE course (Admin only)
@routers.delete("/{course_id}")
async def delete_course(course_id: int, user=Depends(role_required([models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course).where(models.Course.id == course_id))
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(existing)
    await db.commit()
    return {"detail": "Course deleted successfully"}