from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
import os
import shutil
from pathlib import Path

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("./uploads/assignments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ==================== STUDENT ENDPOINTS ====================

@router.get("/my-courses", response_model=List[schemas.CourseOut])
async def get_my_enrolled_courses(
    user=Depends(role_required([models.UserRole.student])),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses the student is enrolled in"""
    result = await db.execute(
        select(models.Course)
        .join(models.Enrollment)
        .where(models.Enrollment.user_id == user.id)
        .options(selectinload(models.Course.instructor))
    )
    return result.scalars().all()

@router.post("/upload", response_model=schemas.SubmissionOut, status_code=201)
async def upload_assignment(
    course_id: int = Form(...),
    file: UploadFile = File(...),
    content: Optional[str] = Form(None),
    user=Depends(role_required([models.UserRole.student])),
    db: AsyncSession = Depends(get_db)
):
    """
    Student uploads assignment for a course.
    Supports PDF and Image formats.
    """
    # Validate file type
    allowed_types = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and Image files (JPEG, PNG) are allowed"
        )

    # Validate file size (max 10MB)
    file_size = await file.seek(0, 2)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    await file.seek(0)

    # Check if course exists
    course_result = await db.execute(
        select(models.Course).where(models.Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if student is enrolled in the course
    enrollment_result = await db.execute(
        select(models.Enrollment).where(
            and_(
                models.Enrollment.user_id == user.id,
                models.Enrollment.course_id == course_id
            )
        )
    )
    if not enrollment_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Save file
    file_extension = Path(file.filename).suffix
    file_name = f"{user.id}_{course_id}_{datetime.utcnow().timestamp()}{file_extension}"
    file_path = UPLOAD_DIR / file_name

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create submission record
    submission = models.Submission(
        course_id=course_id,
        student_id=user.id,
        content=content or f"Assignment uploaded: {file.filename}",
        file_path=str(file_path),
        file_name=file.filename,
        file_type=file.content_type,
        status="pending",
        submitted_at=datetime.utcnow()
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return submission

@router.get("/my-submissions", response_model=List[schemas.SubmissionOut])
async def get_my_submissions(
    user=Depends(role_required([models.UserRole.student])),
    db: AsyncSession = Depends(get_db)
):
    """Get all submissions by the current student"""
    result = await db.execute(
        select(models.Submission)
        .where(models.Submission.student_id == user.id)
        .options(selectinload(models.Submission.course))
        .order_by(models.Submission.submitted_at.desc())
    )
    return result.scalars().all()

# ==================== TEACHER ENDPOINTS ====================

@router.get("/course/{course_id}/submissions", response_model=List[schemas.SubmissionOut])
async def get_course_submissions(
    course_id: int,
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher gets all submissions for their course.
    Only the course instructor can view submissions.
    """
    # Verify course exists and user is the instructor
    course_result = await db.execute(
        select(models.Course).where(models.Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if user.role == models.UserRole.teacher and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view submissions for this course")

    # Get all submissions for the course
    result = await db.execute(
        select(models.Submission)
        .where(models.Submission.course_id == course_id)
        .options(selectinload(models.Submission.student))
        .order_by(models.Submission.submitted_at.desc())
    )
    return result.scalars().all()

@router.get("/submission/{submission_id}", response_model=schemas.SubmissionOut)
async def get_submission_details(
    submission_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific submission"""
    result = await db.execute(
        select(models.Submission)
        .where(models.Submission.id == submission_id)
        .options(selectinload(models.Submission.student))
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Authorization check
    if user.role == models.UserRole.student and submission.student_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this submission")

    if user.role == models.UserRole.teacher:
        course_result = await db.execute(
            select(models.Course).where(models.Course.id == submission.course_id)
        )
        course = course_result.scalar_one_or_none()
        if course.instructor_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this submission")

    return submission

@router.put("/submission/{submission_id}/mark-checked", response_model=schemas.SubmissionOut)
async def mark_submission_checked(
    submission_id: int,
    teacher_notes: Optional[str] = None,
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher marks a submission as checked.
    """
    result = await db.execute(
        select(models.Submission).where(models.Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Authorization check
    course_result = await db.execute(
        select(models.Course).where(models.Course.id == submission.course_id)
    )
    course = course_result.scalar_one_or_none()
    if user.role == models.UserRole.teacher and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to mark this submission")

    # Update submission
    submission.status = "checked"
    submission.checked_at = datetime.utcnow()
    submission.checked_by_id = user.id
    if teacher_notes:
        submission.teacher_notes = teacher_notes

    await db.commit()
    await db.refresh(submission)
    return submission

@router.put("/submission/{submission_id}/mark-pending", response_model=schemas.SubmissionOut)
async def mark_submission_pending(
    submission_id: int,
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher marks a submission back to pending.
    """
    result = await db.execute(
        select(models.Submission).where(models.Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Authorization check
    course_result = await db.execute(
        select(models.Course).where(models.Course.id == submission.course_id)
    )
    course = course_result.scalar_one_or_none()
    if user.role == models.UserRole.teacher and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this submission")

    submission.status = "pending"
    submission.checked_at = None
    submission.checked_by_id = None

    await db.commit()
    await db.refresh(submission)
    return submission

@router.get("/submission/{submission_id}/download")
async def download_submission(
    submission_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Download the submitted file"""
    result = await db.execute(
        select(models.Submission).where(models.Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Authorization check
    if user.role == models.UserRole.student and submission.student_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this submission")

    if user.role == models.UserRole.teacher:
        course_result = await db.execute(
            select(models.Course).where(models.Course.id == submission.course_id)
        )
        course = course_result.scalar_one_or_none()
        if course.instructor_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this submission")

    if not submission.file_path or not os.path.exists(submission.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=submission.file_path,
        filename=submission.file_name,
        media_type=submission.file_type
    )

@router.get("/teacher/dashboard", response_model=dict)
async def teacher_dashboard(
    user=Depends(role_required([models.UserRole.teacher, models.UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get teacher dashboard with all courses and pending submissions.
    """
    # Get all courses taught by this teacher
    courses_result = await db.execute(
        select(models.Course).where(models.Course.instructor_id == user.id)
    )
    courses = courses_result.scalars().all()

    # Get pending submissions for all courses
    course_ids = [c.id for c in courses]
    if course_ids:
        pending_result = await db.execute(
            select(models.Submission)
            .where(
                and_(
                    models.Submission.course_id.in_(course_ids),
                    models.Submission.status == "pending"
                )
            )
            .options(selectinload(models.Submission.student))
            .order_by(models.Submission.submitted_at.desc())
        )
        pending_submissions = pending_result.scalars().all()
    else:
        pending_submissions = []

    return {
        "courses": courses,
        "pending_submissions_count": len(pending_submissions),
        "pending_submissions": pending_submissions
    }
