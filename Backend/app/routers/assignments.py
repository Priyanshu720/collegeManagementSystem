from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

routers = APIRouter()

# GET all assignments for user
@routers.get("/", response_model=List[schemas.AssignmentOut])
async def get_assignments(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role == models.UserRole.student:
        result = await db.execute(select(models.Assignment).where(models.Assignment.student_id == user.id))
    else:
        result = await db.execute(select(models.Assignment))
    return result.scalars().all()

# POST create assignment (Teacher only)
@routers.post("/", response_model=schemas.AssignmentOut)
async def create_assignment(assignment: schemas.AssignmentCreate, user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    new_assignment = models.Assignment(**assignment.dict())
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    return new_assignment

# POST submit assignment (Student only)
@routers.post("/{assignment_id}/submit")
async def submit_assignment(assignment_id: int, submission: schemas.SubmissionCreate, user=Depends(role_required([models.UserRole.student])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Assignment).where(models.Assignment.id == assignment_id))
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    # Create submission logic here
    return {"detail": "Assignment submitted successfully"}