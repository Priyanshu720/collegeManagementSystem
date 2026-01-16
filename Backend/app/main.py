from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base
from .routers import users, courses, assignments, attendance, bookings, reports, grades, submissions
from sqlalchemy import text
from .auth_utils import get_password_hash

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"🔥 Unhandled error: {exc}", exc_info=True)
    # Echo full exception message to client during development for easier debugging
    return JSONResponse(status_code=500, content={"detail": f"Server error: {exc}"})

# Startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
        # Safe migration for new user columns
        try:
            await conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'pending';
            """))
            await conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW());
            """))
            # Ensure admin accounts remain active to avoid lockout post-migration
            await conn.execute(text("""
                UPDATE users SET status='active' WHERE role='admin';
            """))
        except Exception as e:
            # Log but don't crash app on migration issues
            logger.error(f"Startup migration failed: {e}")

        # Ensure exactly one admin exists: if none, create a default one
        try:
            res = await conn.execute(text("SELECT COUNT(*) FROM users WHERE role='admin'"))
            count = res.scalar() or 0
            if count == 0:
                hashed = get_password_hash("admin123")
                await conn.execute(
                    text(
                        """
                        INSERT INTO users (username, email, hashed_password, role, status, created_at)
                        VALUES (:username, :email, :hashed_password, 'admin', 'active', NOW())
                        """
                    ),
                    {"username": "admin", "email": "admin@cm.local", "hashed_password": hashed},
                )
                logger.info("Seeded default admin user: admin@cm.local / admin123")
        except Exception as e:
            logger.error(f"Admin seeding failed: {e}")

# Include routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(courses.router, prefix="/courses", tags=["courses"])
app.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
app.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
app.include_router(grades.router, prefix="/grades", tags=["grades"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
