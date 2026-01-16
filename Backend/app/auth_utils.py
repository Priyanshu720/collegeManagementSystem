# auth_utils.py
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordBearer
from . import models, schemas
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    # copy your previous get_current_user code here
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired")

    result = await db.execute(select(models.User).where(models.User.email == email))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
def _normalize_role(role_item):
    """Return a comparable string value for a role which may be an enum or string."""
    try:
        # Enum instances (from models or schemas) expose .value
        return getattr(role_item, "value", str(role_item))
    except Exception:
        return str(role_item)


def role_required(allowed_roles):
    """Dependency factory enforcing that current user has one of the allowed roles.

    allowed_roles can be a list of models.UserRole, schemas.UserRole, or strings.
    """
    normalized_allowed = {_normalize_role(r) for r in allowed_roles}

    def wrapper(user: models.User = Depends(get_current_user)):
        user_role_value = _normalize_role(user.role)
        if user_role_value not in normalized_allowed:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return user

    return wrapper
