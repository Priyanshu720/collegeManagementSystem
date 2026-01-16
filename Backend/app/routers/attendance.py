from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

router = APIRouter()

# GET attendance records (Student sees own, Teacher/Admin sees all)
@router.get("/", response_model=List[schemas.AttendanceOut])
async def get_attendance(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role == models.UserRole.student:
        result = await db.execute(select(models.Attendance).where(models.Attendance.student_id == user.id))
    else:
        result = await db.execute(select(models.Attendance))
    return result.scalars().all()

# POST mark attendance (Teacher/TA only)
@router.post("/mark", response_model=schemas.AttendanceOut)
async def mark_attendance(attendance: schemas.AttendanceCreate, user=Depends(role_required([models.UserRole.teacher, models.UserRole.ta])), db: AsyncSession = Depends(get_db)):
    new_attendance = models.Attendance(**attendance.dict())
    db.add(new_attendance)
    await db.commit()
    await db.refresh(new_attendance)
    return new_attendance