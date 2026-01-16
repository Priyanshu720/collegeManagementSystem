from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

router = APIRouter()

# POST create review (TA only)
@router.post("/reviews", response_model=schemas.ReviewOut)
async def create_review(
    review: schemas.ReviewCreate,
    user=Depends(role_required([models.UserRole.ta])),
    db: AsyncSession = Depends(get_db)
):
    # Check if submission exists
    result = await db.execute(
        select(models.Submission).where(models.Submission.id == review.submission_id)
    )
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    new_review = models.Review(
        **review.dict(),
        reviewer_id=user.id
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    return new_review

# GET reviews for submission
@router.get("/submissions/{submission_id}/reviews", response_model=List[schemas.ReviewOut])
async def get_submission_reviews(
    submission_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Review).where(models.Review.submission_id == submission_id)
    )
    return result.scalars().all()

# POST assign grade (Teacher only)
@router.post("/", response_model=schemas.GradeOut)
async def assign_grade(
    grade: schemas.GradeCreate,
    user=Depends(role_required([models.UserRole.teacher])),
    db: AsyncSession = Depends(get_db)
):
    # Check if submission exists
    result = await db.execute(
        select(models.Submission).where(models.Submission.id == grade.submission_id)
    )
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check if already graded
    existing_grade = await db.execute(
        select(models.Grade).where(
            and_(
                models.Grade.submission_id == grade.submission_id,
                models.Grade.is_final == True
            )
        )
    )
    if existing_grade.scalars().first():
        raise HTTPException(status_code=400, detail="Already graded")
    
    new_grade = models.Grade(
        **grade.dict(),
        student_id=submission.student_id,
        grader_id=user.id
    )
    db.add(new_grade)
    await db.commit()
    await db.refresh(new_grade)
    return new_grade

# PUT approve/reject grade (HOD only)
@router.put("/{grade_id}/approve")
async def approve_grade(
    grade_id: int,
    user=Depends(role_required([models.UserRole.hod])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Grade).where(models.Grade.id == grade_id)
    )
    grade = result.scalars().first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    grade.is_final = True
    await db.commit()
    return {"detail": "Grade approved"}

# GET grades for student
@router.get("/my", response_model=List[schemas.GradeOut])
async def get_my_grades(
    user=Depends(role_required([models.UserRole.student])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Grade).where(models.Grade.student_id == user.id)
    )
    return result.scalars().all()

# GET all grades (Teacher/Admin)
@router.get("/all", response_model=List[schemas.GradeOut])
async def get_all_grades(
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Grade))
    return result.scalars().all()

# GET grades for assignment
@router.get("/assignments/{assignment_id}", response_model=List[schemas.GradeOut])
async def get_assignment_grades(
    assignment_id: int,
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Grade)
        .join(models.Submission)
        .where(models.Submission.assignment_id == assignment_id)
    )
    return result.scalars().all()


