from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, role_required

routers = APIRouter()

# GET reports (Admin only)
@routers.get("/", response_model=List[schemas.ReportOut])
async def get_reports(user=Depends(role_required([models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Report))
    reports = result.scalars().all()
    return reports

# POST create report (Admin only)
@routers.post("/", response_model=schemas.ReportOut)
async def create_report(report: schemas.ReportCreate, user=Depends(role_required([models.UserRole.admin])), db: AsyncSession = Depends(get_db)):
    new_report = models.Report(**report.dict())
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)
    return new_report