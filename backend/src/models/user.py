from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING, List
from datetime import datetime
from pydantic import field_validator
import uuid

if TYPE_CHECKING:
    from .todo import Todo

class UserBase(SQLModel):
    email: str = Field(unique=True, nullable=False)


class User(UserBase, table=True):
    """
    User model representing a registered user of the application.

    Fields:
    - id (UUID): Unique identifier for the user
    - email (str): User's email address (unique, required)
    - hashed_password (str): Securely hashed password (required)
    - created_at (datetime): Timestamp when the user account was created
    - updated_at (datetime): Timestamp when the user account was last updated
    - is_active (bool): Flag indicating if the user account is active
    """
    __tablename__ = "users"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, nullable=False, index=True)  # Unique index on email
    hashed_password: str = Field(nullable=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    is_active: bool = Field(default=True)

    # Relationship to Todo - using string reference to avoid circular import
    todos: Optional[List["Todo"]] = Relationship(back_populates="user")


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    is_active: bool


class UserCreate(UserBase):
    password: str  # Plain text password for creation, will be hashed before storing

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(SQLModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None