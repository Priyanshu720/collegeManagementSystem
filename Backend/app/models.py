from sqlalchemy import Column, Integer, String, Enum
from .database import Base
import enum

# Step 1: Role Enum
class UserRole(str, enum.Enum):
    student = "student"
    ta = "ta"
    teacher = "teacher"
    hod = "hod"
    admin = "admin"



# Step 2: User Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)  # NEW
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole,name="user_role"), nullable=False)
    # class User(Base):
    # _tablename_ = "users"
    # id = Column(Integer, primary_key=True, index=True)
    # username = Column(String, unique=True, index=True)
    # email = Column(String, unique=True, index=True)
    # hashed_password = Column(String)
    # role = Column(Enum(UserRole, name="user_role"), nullable=False)

    