from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

routers = APIRouter()

# GET all bookings (Student sees own, Admin/Teacher sees all)
@routers.get("/", response_model=List[schemas.BookingOut])
async def get_bookings(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role == models.UserRole.student:
        result = await db.execute(select(models.Booking).where(models.Booking.student_id == user.id))
    else:
        result = await db.execute(select(models.Booking))
    return result.scalars().all()

# POST create a booking request (Student only)
@routers.post("/", response_model=schemas.BookingOut)
async def create_booking(booking: schemas.BookingCreate, user=Depends(role_required([models.UserRole.student])), db: AsyncSession = Depends(get_db)):
    new_booking = models.Booking(**booking.dict())
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    return new_booking

# PUT approve/reject booking (Admin/Teacher only)
@routers.put("/{booking_id}")
async def update_booking_status(booking_id: int, status_update: schemas.BookingStatusUpdate, user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Booking).where(models.Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = status_update.status
    await db.commit()
    await db.refresh(booking)
    return booking