from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import uuid

from ..models.todo import Todo, TodoCreate, TodoUpdate, TodoRead, TodoListResponse
from ..models.user import User
from ..services.todo_service import TodoService
from ..database import get_session
from ..api.auth_dependencies import get_current_user

router = APIRouter(tags=["todos"])

@router.get("/", response_model=TodoListResponse)
def read_todos(
    skip: int = 0,
    limit: int = 50,
    completed: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Retrieve all todos for the authenticated user with optional filtering.

    Args:
        skip (int): Number of records to skip (for pagination)
        limit (int): Maximum number of records to return (max 100)
        completed (Optional[bool]): Filter by completion status (None=all, True=completed, False=not completed)
        current_user (User): The current authenticated user
        session (Session): Database session

    Returns:
        TodoListResponse: Paginated list of todos with metadata
    """
    # Apply maximum limit to prevent abuse
    if limit > 100:
        limit = 100

    todos = TodoService.get_todos(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        completed=completed
    )

    # Get total count for pagination metadata
    from sqlmodel import select
    from sqlalchemy import func

    count_statement = select(func.count(Todo.id)).where(Todo.user_id == current_user.id)
    if completed is not None:
        count_statement = count_statement.where(Todo.completed == completed)
    total_count = session.exec(count_statement).one()

    return TodoListResponse(
        todos=todos,
        total=total_count,
        offset=skip,
        limit=limit
    )


@router.post("/", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo_item(
    todo: TodoCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new todo for the authenticated user.

    Args:
        todo (TodoCreate): Todo creation details
        current_user (User): The current authenticated user
        session (Session): Database session

    Returns:
        TodoRead: The created todo item
    """
    db_todo = TodoService.create_todo(
        session=session,
        todo_create=todo,
        user_id=current_user.id
    )
    return db_todo


@router.get("/{todo_id}", response_model=TodoRead)
def read_todo(
    todo_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Retrieve a specific todo by ID for the authenticated user.

    Args:
        todo_id (str): ID of the todo to retrieve
        current_user (User): The current authenticated user
        session (Session): Database session

    Returns:
        TodoRead: The requested todo item

    Raises:
        HTTPException: If todo doesn't exist or doesn't belong to the user
    """
    # Convert the todo ID to UUID
    try:
        todo_uuid = uuid.UUID(todo_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid todo ID format"
        )

    db_todo = TodoService.get_todo_by_id(
        session=session,
        todo_id=todo_uuid,
        user_id=current_user.id
    )

    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or does not belong to the authenticated user"
        )

    return db_todo


@router.put("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: str,
    todo_update: TodoUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update a specific todo by ID for the authenticated user.

    Args:
        todo_id (str): ID of the todo to update
        todo_update (TodoUpdate): Updates to apply
        current_user (User): The current authenticated user
        session (Session): Database session

    Returns:
        TodoRead: The updated todo item

    Raises:
        HTTPException: If todo doesn't exist or doesn't belong to the user
    """
    # Convert the todo ID to UUID
    try:
        todo_uuid = uuid.UUID(todo_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid todo ID format"
        )

    db_todo = TodoService.update_todo(
        session=session,
        todo_id=todo_uuid,
        user_id=current_user.id,
        todo_update=todo_update
    )

    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or does not belong to the authenticated user"
        )

    return db_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a specific todo by ID for the authenticated user.

    Args:
        todo_id (str): ID of the todo to delete
        current_user (User): The current authenticated user
        session (Session): Database session

    Raises:
        HTTPException: If todo doesn't exist or doesn't belong to the user
    """
    # Convert the todo ID to UUID
    try:
        todo_uuid = uuid.UUID(todo_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid todo ID format"
        )

    success = TodoService.delete_todo(
        session=session,
        todo_id=todo_uuid,
        user_id=current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or does not belong to the authenticated user"
        )

    # Return 204 No Content on successful deletion
    return


@router.patch("/{todo_id}/complete", response_model=TodoRead)
def toggle_todo_completion(
    todo_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Toggle the completion status of a specific todo for the authenticated user.

    Args:
        todo_id (str): ID of the todo to toggle
        current_user (User): The current authenticated user
        session (Session): Database session

    Returns:
        TodoRead: The updated todo item with toggled completion status

    Raises:
        HTTPException: If todo doesn't exist or doesn't belong to the user
    """
    # Convert the todo ID to UUID
    try:
        todo_uuid = uuid.UUID(todo_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid todo ID format"
        )

    db_todo = TodoService.toggle_completion(
        session=session,
        todo_id=todo_uuid,
        user_id=current_user.id
    )

    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or does not belong to the authenticated user"
        )

    return db_todo