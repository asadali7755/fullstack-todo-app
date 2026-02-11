from sqlmodel import Session, select
from typing import List, Optional
from uuid import UUID
from ..models.todo import Todo, TodoCreate, TodoUpdate
from ..models.user import User
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError, IntegrityError


class TodoService:
    @staticmethod
    def create_todo(session: Session, todo_create: TodoCreate, user_id: UUID) -> Todo:
        """
        Create a new todo item for the specified user.

        Args:
            session (Session): Database session
            todo_create (TodoCreate): Todo creation details
            user_id (UUID): ID of the user who owns the todo

        Returns:
            Todo: The created todo item

        Raises:
            IntegrityError: If there's a constraint violation
            SQLAlchemyError: If there's a database error
        """
        try:
            # Create the todo object with the user_id
            db_todo = Todo(
                title=todo_create.title,
                description=todo_create.description,
                completed=todo_create.completed,
                user_id=user_id,
            )

            # Set timestamps
            now = datetime.utcnow()
            db_todo.created_at = now
            db_todo.updated_at = now

            # Add to session and commit
            session.add(db_todo)
            session.commit()
            session.refresh(db_todo)

            return db_todo
        except IntegrityError:
            session.rollback()
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def get_todos(
        session: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100,
        completed: Optional[bool] = None
    ) -> List[Todo]:
        """
        Get all todos for a specific user with optional filtering.

        Args:
            session (Session): Database session
            user_id (UUID): ID of the user whose todos to retrieve
            skip (int): Number of records to skip (for pagination)
            limit (int): Maximum number of records to return
            completed (Optional[bool]): Filter by completion status (None=all, True=completed, False=not completed)

        Returns:
            List[Todo]: List of todos belonging to the user

        Raises:
            SQLAlchemyError: If there's a database error
        """
        try:
            query = select(Todo).where(Todo.user_id == user_id)

            if completed is not None:
                query = query.where(Todo.completed == completed)

            query = query.offset(skip).limit(limit)

            todos = session.exec(query).all()
            return todos
        except SQLAlchemyError:
            raise

    @staticmethod
    def get_todo_by_id(
        session: Session,
        todo_id: UUID,
        user_id: UUID
    ) -> Optional[Todo]:
        """
        Get a specific todo by its ID and verify it belongs to the specified user.

        Args:
            session (Session): Database session
            todo_id (UUID): ID of the todo to retrieve
            user_id (UUID): ID of the user who should own the todo

        Returns:
            Todo: The todo if found and owned by the user, None otherwise

        Raises:
            SQLAlchemyError: If there's a database error
        """
        try:
            statement = select(Todo).where(Todo.id == todo_id).where(Todo.user_id == user_id)
            todo = session.exec(statement).first()
            return todo
        except SQLAlchemyError:
            raise

    @staticmethod
    def update_todo(
        session: Session,
        todo_id: UUID,
        user_id: UUID,
        todo_update: TodoUpdate
    ) -> Optional[Todo]:
        """
        Update a specific todo by its ID if it belongs to the specified user.

        Args:
            session (Session): Database session
            todo_id (UUID): ID of the todo to update
            user_id (UUID): ID of the user who should own the todo
            todo_update (TodoUpdate): Updates to apply

        Returns:
            Todo: The updated todo if found and owned by the user, None otherwise

        Raises:
            IntegrityError: If there's a constraint violation
            SQLAlchemyError: If there's a database error
        """
        try:
            # Get the todo and verify ownership
            db_todo = TodoService.get_todo_by_id(session, todo_id, user_id)

            if not db_todo:
                return None

            # Update the todo with the provided values
            todo_data = todo_update.model_dump(exclude_unset=True)
            for field, value in todo_data.items():
                setattr(db_todo, field, value)

            # Update the timestamp
            db_todo.updated_at = datetime.utcnow()

            # Commit changes
            session.add(db_todo)
            session.commit()
            session.refresh(db_todo)

            return db_todo
        except IntegrityError:
            session.rollback()
            raise
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def delete_todo(
        session: Session,
        todo_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Delete a specific todo by its ID if it belongs to the specified user.

        Args:
            session (Session): Database session
            todo_id (UUID): ID of the todo to delete
            user_id (UUID): ID of the user who should own the todo

        Returns:
            bool: True if the todo was found and deleted, False otherwise

        Raises:
            SQLAlchemyError: If there's a database error
        """
        try:
            # Get the todo and verify ownership
            db_todo = TodoService.get_todo_by_id(session, todo_id, user_id)

            if not db_todo:
                return False

            # Delete the todo
            session.delete(db_todo)
            session.commit()

            return True
        except SQLAlchemyError:
            session.rollback()
            raise

    @staticmethod
    def toggle_completion(
        session: Session,
        todo_id: UUID,
        user_id: UUID
    ) -> Optional[Todo]:
        """
        Toggle the completion status of a specific todo if it belongs to the specified user.

        Args:
            session (Session): Database session
            todo_id (UUID): ID of the todo to toggle
            user_id (UUID): ID of the user who should own the todo

        Returns:
            Todo: The updated todo if found and owned by the user, None otherwise

        Raises:
            SQLAlchemyError: If there's a database error
        """
        try:
            # Get the todo and verify ownership
            db_todo = TodoService.get_todo_by_id(session, todo_id, user_id)

            if not db_todo:
                return None

            # Toggle the completion status
            db_todo.completed = not db_todo.completed
            db_todo.updated_at = datetime.utcnow()

            # Commit changes
            session.add(db_todo)
            session.commit()
            session.refresh(db_todo)

            return db_todo
        except SQLAlchemyError:
            session.rollback()
            raise