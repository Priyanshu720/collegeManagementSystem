from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

router = APIRouter()

# GET all assignments for user based on role
@router.get("/", response_model=List[schemas.AssignmentOut])
async def get_assignments(
    user=Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if user.role == models.UserRole.student:
        # Students see assignments for courses they're enrolled in
        result = await db.execute(
            select(models.Assignment)
            .join(models.Enrollment, models.Assignment.course_id == models.Enrollment.course_id)
            .where(models.Enrollment.user_id == user.id)
            .where(models.Assignment.is_active == True)
        )
    elif user.role == models.UserRole.ta:
        # TAs see assignments they can review
        result = await db.execute(
            select(models.Assignment)
            .where(models.Assignment.is_active == True)
        )
    else:
        # Teachers, HODs, Admins see all assignments
        result = await db.execute(select(models.Assignment))
    
    return result.scalars().all()

# GET assignment by ID
@router.get("/{assignment_id}", response_model=schemas.AssignmentOut)
async def get_assignment(
    assignment_id: int, 
    user=Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Assignment).where(models.Assignment.id == assignment_id)
    )
    assignment = result.scalars().first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

# POST create assignment (Teacher/Admin only)
@router.post("/", response_model=schemas.AssignmentOut)
async def create_assignment(
    assignment: schemas.AssignmentCreate, 
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])), 
    db: AsyncSession = Depends(get_db)
):
    new_assignment = models.Assignment(
        **assignment.dict(),
        created_by_id=user.id
    )
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    return new_assignment

# PUT update assignment (Teacher/Admin only)
@router.put("/{assignment_id}", response_model=schemas.AssignmentOut)
async def update_assignment(
    assignment_id: int, 
    assignment: schemas.AssignmentCreate, 
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Assignment).where(models.Assignment.id == assignment_id)
    )
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    for key, value in assignment.dict().items():
        setattr(existing, key, value)
    
    await db.commit()
    await db.refresh(existing)
    return existing

# DELETE assignment (Admin only)
@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int, 
    user=Depends(role_required([models.UserRole.admin])), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Assignment).where(models.Assignment.id == assignment_id)
    )
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    existing.is_active = False
    await db.commit()
    return {"detail": "Assignment deactivated successfully"}

# POST submit assignment (Student only)
@router.post("/{assignment_id}/submit", response_model=schemas.SubmissionOut)
async def submit_assignment(
    assignment_id: int, 
    submission: schemas.SubmissionCreate, 
    user=Depends(role_required([models.UserRole.student])), 
    db: AsyncSession = Depends(get_db)
):
    # Check if assignment exists and is active
    result = await db.execute(
        select(models.Assignment).where(models.Assignment.id == assignment_id)
    )
    assignment = result.scalars().first()
    if not assignment or not assignment.is_active:
        raise HTTPException(status_code=404, detail="Assignment not found or inactive")
    
    # Check if student is enrolled in the course
    enrollment_result = await db.execute(
        select(models.Enrollment).where(
            and_(
                models.Enrollment.user_id == user.id,
                models.Enrollment.course_id == assignment.course_id
            )
        )
    )
    if not enrollment_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Check if already submitted
    existing_submission = await db.execute(
        select(models.Submission).where(
            and_(
                models.Submission.assignment_id == assignment_id,
                models.Submission.student_id == user.id
            )
        )
    )
    if existing_submission.scalars().first():
        raise HTTPException(status_code=400, detail="Already submitted")
    
    # Create submission
    is_late = assignment.due_date and datetime.utcnow() > assignment.due_date
    new_submission = models.Submission(
        assignment_id=assignment_id,
        student_id=user.id,
        content=submission.content,
        file_path=submission.file_path,
        is_late=is_late
    )
    
    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)
    return new_submission

# GET submissions for assignment (Teacher/TA/Admin)
@router.get("/{assignment_id}/submissions", response_model=List[schemas.SubmissionOut])
async def get_assignment_submissions(
    assignment_id: int,
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.ta, models.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Submission)
        .where(models.Submission.assignment_id == assignment_id)
        .options(selectinload(models.Submission.student))
    )
    return result.scalars().all()

# GET my submissions (Student)
@router.get("/my/submissions", response_model=List[schemas.SubmissionOut])
async def get_my_submissions(
    user=Depends(role_required([models.UserRole.student])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Submission)
        .where(models.Submission.student_id == user.id)
        .options(selectinload(models.Submission.assignment))
    )
    return result.scalars().all()

# POST review submission (TA/Teacher only)
@router.post("/{assignment_id}/submissions/{submission_id}/review", response_model=schemas.ReviewOut)
async def review_submission(
    assignment_id: int,
    submission_id: int,
    review: schemas.ReviewCreate,
    user=Depends(role_required([models.UserRole.ta, models.UserRole.teacher])),
    db: AsyncSession = Depends(get_db)
):
    # Verify submission exists and belongs to the assignment
    result = await db.execute(
        select(models.Submission).where(
            and_(
                models.Submission.id == submission_id,
                models.Submission.assignment_id == assignment_id
            )
        )
    )
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Create review
    new_review = models.Review(
        submission_id=submission_id,
        reviewer_id=user.id,
        comments=review.comments,
        recommendations=review.recommendations,
        flagged_issues=review.flagged_issues
    )
    
    # Update submission status
    submission.status = "reviewed"
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    return new_review

# GET reviews for submission
@router.get("/{assignment_id}/submissions/{submission_id}/reviews", response_model=List[schemas.ReviewOut])
async def get_submission_reviews(
    assignment_id: int,
    submission_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if user has access to these reviews
    submission_result = await db.execute(
        select(models.Submission).where(models.Submission.id == submission_id)
    )
    submission = submission_result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    # Students can only see their own submission reviews
    if user.role == models.UserRole.student and submission.student_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these reviews")
    
    result = await db.execute(
        select(models.Review).where(models.Review.submission_id == submission_id)
    )
    return result.scalars().all()

# POST submit assignment (Student only) - General endpoint
@router.post("/submit", response_model=schemas.SubmissionOut)
async def submit_assignment_general(
    submission: schemas.SubmissionCreate, 
    user=Depends(role_required([models.UserRole.student])), 
    db: AsyncSession = Depends(get_db)
):
    # Check if assignment exists and is active
    result = await db.execute(
        select(models.Assignment).where(models.Assignment.id == submission.assignment_id)
    )
    assignment = result.scalars().first()
    if not assignment or not assignment.is_active:
        raise HTTPException(status_code=404, detail="Assignment not found or inactive")
    
    # Check if student is enrolled in the course
    enrollment_result = await db.execute(
        select(models.Enrollment).where(
            and_(
                models.Enrollment.user_id == user.id,
                models.Enrollment.course_id == assignment.course_id
            )
        )
    )
    if not enrollment_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Check if already submitted
    existing_submission = await db.execute(
        select(models.Submission).where(
            and_(
                models.Submission.assignment_id == submission.assignment_id,
                models.Submission.student_id == user.id
            )
        )
    )
    if existing_submission.scalars().first():
        raise HTTPException(status_code=400, detail="Already submitted")
    
    # Create submission
    is_late = assignment.due_date and datetime.utcnow() > assignment.due_date
    new_submission = models.Submission(
        assignment_id=submission.assignment_id,
        student_id=user.id,
        content=submission.content,
        file_path=submission.file_path,
        is_late=is_late
    )
    
    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)
    return new_submission