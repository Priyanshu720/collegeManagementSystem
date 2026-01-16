from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

router = APIRouter()

# GET courses enrolled by the current student
@router.get("/my", response_model=List[schemas.CourseOut])
async def get_my_courses(
    current_user=Depends(role_required([schemas.UserRole.student])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Course)
        .join(models.Enrollment)
        .where(models.Enrollment.user_id == current_user.id)
        .options(selectinload(models.Course.instructor))
    )
    courses = result.scalars().all()
    return courses

# GET courses taught by the current teacher
@router.get("/teaching", response_model=List[schemas.CourseOut])
async def get_teaching_courses(
    current_user=Depends(role_required([schemas.UserRole.teacher, schemas.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Course)
        .where(models.Course.instructor_id == current_user.id)
        .options(selectinload(models.Course.instructor))
    )
    courses = result.scalars().all()
    return courses

# GET all courses
@router.get("/", response_model=List[schemas.CourseOut])
async def get_courses(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Course)
        .options(selectinload(models.Course.instructor))
    )
    courses = result.scalars().all()
    return courses

# GET course by ID
@router.get("/{course_id}", response_model=schemas.CourseOut)
async def get_course(course_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course).where(models.Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

# POST create course (Teacher/Admin)
@router.post("/", response_model=schemas.CourseOut)
async def create_course(course: schemas.CourseCreate, user=Depends(role_required([models.UserRole.teacher, models.UserRole.hod])), db: AsyncSession = Depends(get_db)):
    # basic validations similar to admin endpoints
    payload = course.dict()
    name = (payload.get("name") or "").strip()
    if not (3 <= len(name) <= 100):
        raise HTTPException(status_code=422, detail="name must be 3-100 characters")
    credits = payload.get("credits", 3)
    if not (1 <= int(credits) <= 10):
        raise HTTPException(status_code=422, detail="credits must be between 1 and 10")
    max_students = payload.get("max_students", 30)
    if not (1 <= int(max_students) <= 1000):
        raise HTTPException(status_code=422, detail="max_students must be between 1 and 1000")
    # optional instructor must exist and be teacher/hod if provided
    instructor_id = payload.get("instructor_id")
    if instructor_id is not None:
        res_user = await db.execute(select(models.User).where(models.User.id == instructor_id))
        inst = res_user.scalars().first()
        if not inst or inst.role not in {models.UserRole.teacher, models.UserRole.hod}:
            raise HTTPException(status_code=400, detail="instructor_id must reference a TEACHER or HOD")
    try:
        new_course = models.Course(**{**payload, "name": name})
        db.add(new_course)
        await db.commit()
        await db.refresh(new_course)
        return new_course
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Course with this name already exists")

# PUT update course (Teacher/Admin)
@router.put("/{course_id}", response_model=schemas.CourseOut)
async def update_course(course_id: int, course: schemas.CourseCreate, user=Depends(role_required([models.UserRole.teacher, models.UserRole.hod])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course).where(models.Course.id == course_id))
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")

    payload = course.dict()
    name = (payload.get("name") or "").strip()
    if not (3 <= len(name) <= 100):
        raise HTTPException(status_code=422, detail="name must be 3-100 characters")
    credits = payload.get("credits", 3)
    if not (1 <= int(credits) <= 10):
        raise HTTPException(status_code=422, detail="credits must be between 1 and 10")
    max_students = payload.get("max_students", 30)
    if not (1 <= int(max_students) <= 1000):
        raise HTTPException(status_code=422, detail="max_students must be between 1 and 1000")

    instructor_id = payload.get("instructor_id")
    if instructor_id is not None:
        res_user = await db.execute(select(models.User).where(models.User.id == instructor_id))
        inst = res_user.scalars().first()
        if not inst or inst.role not in {models.UserRole.teacher, models.UserRole.hod}:
            raise HTTPException(status_code=400, detail="instructor_id must reference a TEACHER or HOD")

    try:
        for key, value in {**payload, "name": name}.items():
            setattr(existing, key, value)
        await db.commit()
        await db.refresh(existing)
        return existing
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Course with this name already exists")

# DELETE course (Admin only)
@router.delete("/{course_id}")
async def delete_course(course_id: int, user=Depends(role_required([models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Course).where(models.Course.id == course_id))
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(existing)
    await db.commit()
    return {"detail": "Course deleted successfully"}

# GET students enrolled in a course (Teacher/Admin only)
@router.get("/{course_id}/students", response_model=List[schemas.UserOut])
async def get_course_students(
    course_id: int,
    user=Depends(role_required([schemas.UserRole.teacher, schemas.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.User)
        .join(models.Enrollment)
        .where(
            models.Enrollment.course_id == course_id,
            models.User.role == models.UserRole.student
        )
    )
    students = result.scalars().all()
    return students

#

# POST enroll in a course (Student only)
@router.post("/enroll/{course_id}")
async def enroll_course(
    course_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # check if already enrolled
    result = await db.execute(
        select(models.Enrollment).where(
            models.Enrollment.user_id == user.id,
            models.Enrollment.course_id == course_id
        )
    )
    existing = result.scalars().first()
    if existing:
        return {"detail": "Already enrolled"}

    # create new enrollment
    new_enroll = models.Enrollment(user_id=user.id, course_id=course_id)
    db.add(new_enroll)
    await db.commit()
    return {"detail": "Enrolled successfully"}