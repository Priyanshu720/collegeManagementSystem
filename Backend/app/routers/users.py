from datetime import datetime, timedelta
from typing import Optional, List
from ..auth_utils import get_password_hash, verify_password, create_access_token, get_current_user, role_required


from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.future import select
from sqlalchemy import or_, func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app import models, schemas
from ..database import engine, get_db, Base
from fastapi import APIRouter, Body, Query

import logging

# ========================
# Logger setup
# ========================
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ========================
# FastAPI app setup
# ========================
router = APIRouter()

# Enable CORS
# routers.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# ========================
# Security config
# ========================
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ========================
# Global Exception Handler
# ========================
# @routers.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"🔥 Unhandled error: {exc}", exc_info=True)
#     return JSONResponse(
#         status_code=500,
#         content={"detail": str(exc)},
#     )

# ========================
# Utils
# ========================
# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     return pwd_context.hash(password)

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Use shared get_current_user and role_required from auth_utils

# ========================
# Startup event (create tables)
# ========================
# No router-level startup hooks; app-level handles DB init

# ========================
# API endpoints
# ========================
@router.post("/register", response_model=schemas.UserOut)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(models.User).where(models.User.email == user.email))
        db_user = result.scalars().first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = get_password_hash(user.password)
        role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
        if role_value.startswith("UserRole."):
            role_value = role_value.split(".")[-1]
        if role_value == "admin":
            raise HTTPException(status_code=400, detail="Admin cannot be registered via this form")
        new_user = models.User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            role=models.UserRole(role_value)
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user
    except IntegrityError as ie:
        await db.rollback()
        logger.error(f"Integrity error during registration: {ie}")
        raise HTTPException(status_code=400, detail="User already exists or invalid data")
    except Exception as exc:
        await db.rollback()
        logger.error(f"Registration failed: {exc}")
        # Return the exception message to help debug locally
        raise HTTPException(status_code=500, detail=f"Registration failed: {exc}")

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    try:
        identifier = (form_data.username or "").strip()
        logger.debug(f"Login attempt for: {identifier}")
        result = await db.execute(
            select(models.User).where(
                or_(
                    models.User.email == identifier,
                    models.User.username == identifier
                )
            )
        )
        user = result.scalars().first()

        # Verify password safely; if verification explodes due to invalid hash, treat as invalid credentials
        try:
            valid_password = bool(user) and verify_password(form_data.password, user.hashed_password)
        except Exception as ver_exc:
            logger.warning(f"Password verification failed for {identifier}: {ver_exc}")
            valid_password = False

        if not user or not valid_password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

        # Enforce account approval workflow
        status_value = getattr(user, "status", "active") or "active"
        if status_value != "active":
            detail_msg = "Account pending approval" if status_value == "pending" else "Account is not active"
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail_msg)

        # Normalize role for token and response in case user.role is a plain string instead of enum
        role_value = getattr(user.role, "value", str(user.role))

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "role": role_value},
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": role_value,
            "username": user.username
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Login failed: {exc}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


#

# ========================
# Example role-based routes
# ========================
@router.get("/teacher-dashboard")
async def teacher_dashboard(user=Depends(role_required([schemas.UserRole.teacher, schemas.UserRole.hod, schemas.UserRole.admin]))):
    return {"message": f"Welcome {user.username}, role: {user.role}"}

@router.get("/admin-panel")
async def admin_panel(user=Depends(role_required([schemas.UserRole.admin]))):
    return {"message": f"Admin access granted for {user.username}"}


@router.get("/pending", response_model=List[schemas.UserOut])
async def list_pending_users(
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required([schemas.UserRole.admin]))
):
    try:
        result = await db.execute(
            select(models.User).where(
                models.User.status == "pending",
                models.User.role != models.UserRole.admin,
            ).order_by(models.User.created_at.desc())
        )
        users = result.scalars().all()
        return users
    except Exception as exc:
        logger.error(f"Failed to fetch pending users: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch pending users")


@router.patch("/{user_id}/approve", response_model=schemas.UserOut)
async def approve_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required([schemas.UserRole.admin]))
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    target = result.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == models.UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot modify admin via this endpoint")

    target.status = "active"
    try:
        await db.commit()
        await db.refresh(target)
        return target
    except Exception as exc:
        await db.rollback()
        logger.error(f"Failed to approve user {user_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to approve user")


@router.patch("/{user_id}/reject", response_model=schemas.UserOut)
async def reject_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required([schemas.UserRole.admin]))
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    target = result.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == models.UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot modify admin via this endpoint")

    target.status = "rejected"
    try:
        await db.commit()
        await db.refresh(target)
        return target
    except Exception as exc:
        await db.rollback()
        logger.error(f"Failed to reject user {user_id}: {exc}")
        raise HTTPException(status_code=500, detail="Failed to reject user")


# ========================
# Admin user management endpoints used by frontend AdminUsers
# ========================
@router.get("")
async def list_users(
    q: Optional[str] = Query(default=None, description="Search by email or username"),
    role: Optional[str] = Query(default=None, description="Filter by role"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required([schemas.UserRole.admin]))
):
    try:
        filters = []
        if q:
            q_lower = f"%{q.lower()}%"
            filters.append(
                or_(
                    func.lower(models.User.email).like(q_lower),
                    func.lower(models.User.username).like(q_lower),
                )
            )
        if role:
            try:
                role_enum = models.UserRole(role)
                filters.append(models.User.role == role_enum)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid role filter")
        if status:
            if status not in {"active", "pending", "rejected"}:
                raise HTTPException(status_code=400, detail="Invalid status filter")
            filters.append(models.User.status == status)

        # Total count
        count_stmt = select(func.count(models.User.id))
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = (await db.execute(count_stmt)).scalar() or 0

        # Page items
        stmt = select(models.User)
        if filters:
            stmt = stmt.where(*filters)
        stmt = stmt.order_by(models.User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(stmt)
        users_list = result.scalars().all()

        def serialize(u: models.User):
            return {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": getattr(u.role, "value", str(u.role)),
                "status": u.status,
                "created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
            }

        return {
            "items": [serialize(u) for u in users_list],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to list users: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")


@router.get("/roles/list")
async def list_roles(user=Depends(role_required([schemas.UserRole.admin]))):
    try:
        return {"roles": [r.value for r in schemas.UserRole]}
    except Exception as exc:
        logger.error(f"Failed to list roles: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch roles")


@router.patch("/{user_id}")
async def update_user(
    user_id: int,
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required([schemas.UserRole.admin]))
):
    try:
        result = await db.execute(select(models.User).where(models.User.id == user_id))
        target = result.scalars().first()
        if not target:
            raise HTTPException(status_code=404, detail="User not found")

        # Restrict critical changes to admin user
        if target.role == models.UserRole.admin and any(k in payload for k in ["role", "status"]):
            raise HTTPException(status_code=400, detail="Cannot modify admin role or status")

        if "username" in payload and payload["username"]:
            target.username = str(payload["username"]).strip()
        if "email" in payload and payload["email"]:
            target.email = str(payload["email"]).strip()
        if "role" in payload and payload["role"]:
            role_value = payload["role"]
            if isinstance(role_value, str) and role_value.startswith("UserRole."):
                role_value = role_value.split(".")[-1]
            try:
                target.role = models.UserRole(str(role_value))
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid role value")
        if "status" in payload and payload["status"]:
            status_val = str(payload["status"]).lower()
            if status_val not in {"active", "pending", "rejected"}:
                raise HTTPException(status_code=400, detail="Invalid status value")
            target.status = status_val

        await db.commit()
        await db.refresh(target)
        return {
            "id": target.id,
            "username": target.username,
            "email": target.email,
            "role": getattr(target.role, "value", str(target.role)),
            "status": target.status,
            "created_at": target.created_at.isoformat() if getattr(target, "created_at", None) else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        logger.error(f"Failed to update user {user_id}: {exc}")
        raise HTTPException(status_code=500, detail="Update failed")


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required([schemas.UserRole.admin]))
):
    try:
        result = await db.execute(select(models.User).where(models.User.id == user_id))
        target = result.scalars().first()
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        if target.role == models.UserRole.admin:
            raise HTTPException(status_code=400, detail="Cannot delete admin user")

        await db.delete(target)
        await db.commit()
        return {"detail": "User deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        await db.rollback()
        logger.error(f"Failed to delete user {user_id}: {exc}")
        raise HTTPException(status_code=500, detail="Delete failed")
