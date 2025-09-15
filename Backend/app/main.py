# from datetime import datetime, timedelta
# from typing import Optional

# from fastapi import FastAPI, Depends, HTTPException, status, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from fastapi.responses import JSONResponse

# from jose import JWTError, jwt
# from passlib.context import CryptContext 
# from sqlalchemy.future import select
# from sqlalchemy.ext.asyncio import AsyncSession

# from . import models, schemas
# from .database import engine, get_db, Base

# import logging

# # ========================
# # Logger setup
# # ========================
# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

# # ========================
# # FastAPI app setup
# # ========================
# app = FastAPI()

# # Enable CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ========================
# # Security config
# # ========================
# SECRET_KEY = "your_secret_key"  # ⚠ production me ENV variable use karo
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# # ========================
# # Global Exception Handler
# # ========================
# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"🔥 Unhandled error: {exc}", exc_info=True)
#     return JSONResponse(
#         status_code=500,
#         content={"detail": str(exc)},
#     )

# # ========================
# # Utils
# # ========================
# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     return pwd_context.hash(password)

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
#     try:        
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         email: str = payload.get("sub")
#         role: str = payload.get("role")
#         if email is None or role is None:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
#     except JWTError:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired")

#     result = await db.execute(select(models.User).where(models.User.email == email))
#     user = result.scalars().first()
#     if user is None:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
#     return user

# def role_required(allowed_roles: list[schemas.UserRole]):
#     def wrapper(user: models.User = Depends(get_current_user)):
#         if user.role not in allowed_roles:
#             raise HTTPException(status_code=403, detail="Not enough permissions")
#         return user
#     return wrapper

# # ========================
# # Startup event (create tables)
# # ========================
# @app.on_event("startup")
# async def startup():
#     async with engine.begin() as conn:
#         # ⚠ Agar tables change karte ho to uncomment karo:
#         # await conn.run_sync(Base.metadata.drop_all)
#         # await conn.run_sync(Base.metadata.create_all)
#         pass

# # ========================
# # API endpoints
# # ========================
# @app.post("/register", response_model=schemas.UserOut)
# async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
#     result = await db.execute(select(models.User).where(models.User.email == user.email))
#     db_user = result.scalars().first()
#     if db_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     hashed_password = get_password_hash(user.password)
#     new_user = models.User(
#         username=user.username,
#         email=user.email,
#         hashed_password=hashed_password,
#         role=models.UserRole(user.role)
#     )
#     db.add(new_user)
#     await db.commit()
#     await db.refresh(new_user)
#     return new_user

# @app.post("/login")
# async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
#     result = await db.execute(select(models.User).where(models.User.email == form_data.username))
#     user = result.scalars().first()

#     if not user or not verify_password(form_data.password, user.hashed_password):
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

#     access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     access_token = create_access_token(
#         data={"sub": user.email, "role": user.role.value},
#         expires_delta=access_token_expires
#     )
#     return {
#     "access_token": access_token,
#     "token_type": "bearer",
#     "role": user.role.value,   # ✅ send the role to frontend
#     "username": user.username  # optional: also send username
# }


# @app.get("/me", response_model=schemas.UserOut)
# async def read_users_me(current_user: models.User = Depends(get_current_user)):
#     return current_user

# # ========================
# # Example role-based routes
# # ========================
# @app.get("/teacher-dashboard")
# async def teacher_dashboard(user=Depends(role_required([schemas.UserRole.teacher, schemas.UserRole.hod, schemas.UserRole.admin]))):
#     return {"message": f"Welcome {user.username}, role: {user.role}"}

# @app.get("/admin-panel")
# async def admin_panel(user=Depends(role_required([schemas.UserRole.admin]))):
#     return {"message": f"Admin access granted for {user.username}"}








from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base
from .routers import users
from .routers import users, courses, assignments, attendance, bookings, reports

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"🔥 Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# Startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Include routers
app.include_router(users.routers, prefix="/users", tags=["Users"])
