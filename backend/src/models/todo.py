from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING, List
from datetime import datetime
import uuid
from pydantic import validator

if TYPE_CHECKING:
    from .user import User, UserRead

class TodoBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)

    @validator('title')
    def validate_title(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Title must not be empty')
        if len(v) > 255:
            raise ValueError('Title must be between 1-255 characters')
        return v.strip()

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 1000:
            raise ValueError('Description must be ≤ 1000 characters if provided')
        return v


class Todo(TodoBase, table=True):
    """
    Todo model representing a task item owned by a specific user.

    Fields:
    - id (UUID): Unique identifier for the todo
    - title (str): Title or description of the task (required)
    - description (str): Detailed description of the task (optional)
    - completed (bool): Flag indicating if the task is completed
    - user_id (UUID): Foreign key linking to the owning user
    - created_at (datetime): Timestamp when the todo was created
    - updated_at (datetime): Timestamp when the todo was last updated
    """
    __tablename__ = "todos"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False, index=True)  # Index for efficient user-based queries
    completed: bool = Field(default=False, index=True)  # Index for filtering completed tasks
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationship to User
    user: Optional["User"] = Relationship(back_populates="todos")


class TodoRead(TodoBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TodoCreate(TodoBase):
    pass


class TodoUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class TodoListResponse(SQLModel):
    todos: List[TodoRead]
    total: int
    offset: int
    limit: int