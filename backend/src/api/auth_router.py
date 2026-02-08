from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import Dict
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str
from ..models.user import User, UserCreate, UserRead
from ..services.auth_service import authenticate_user, create_user, get_user_by_email, create_access_token_for_user, get_user_by_id, create_refresh_token_for_user, verify_refresh_token
from ..database import get_session
from ..middleware.auth import get_current_user
from datetime import timedelta
import os
import uuid

router = APIRouter(tags=["authentication"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_create: UserCreate, session: Session = Depends(get_session)):
    """
    Register a new user account.

    Args:
        user_create (UserCreate): User registration details
        session (Session): Database session

    Returns:
        UserRead: The created user information

    Raises:
        HTTPException: If email is already registered or password validation fails
    """
    try:
        # Create the user
        db_user = create_user(session, user_create)

        # Return the user (without password)
        return db_user
    except ValueError as e:
        # Handle different types of value errors
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            status_code = status.HTTP_409_CONFLICT
        elif "at least 8 characters" in error_msg.lower():
            status_code = status.HTTP_400_BAD_REQUEST
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        
        raise HTTPException(
            status_code=status_code,
            detail=error_msg
        )


@router.post("/login")
def login(login_request: LoginRequest, session: Session = Depends(get_session)):
    """
    Authenticate user and return JWT.

    Args:
        login_request (LoginRequest): User's email address and password
        session (Session): Database session

    Returns:
        dict: Access token and token type

    Raises:
        HTTPException: If credentials are invalid
    """
    # Authenticate the user
    user = authenticate_user(session, login_request.email, login_request.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token_for_user(user)
    # Create refresh token
    refresh_token = create_refresh_token_for_user(user)

    # Return tokens
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60  # in seconds
    }


@router.post("/refresh")
def refresh_token_endpoint(refresh_token: str):
    """
    Refresh an access token using a refresh token.

    Args:
        refresh_token (str): The refresh token

    Returns:
        dict: New access token and token type

    Raises:
        HTTPException: If refresh token is invalid
    """
    # Verify the refresh token
    payload = verify_refresh_token(refresh_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user ID from the payload
    user_id = payload.get("sub")

    # Since we're using stateless JWTs, we could create a new access token
    # In a real implementation with refresh token storage, you'd verify the refresh token exists in DB
    new_access_token_data = {
        "sub": user_id,
        "email": payload.get("email")
    }

    new_access_token = create_access_token_for_user(new_access_token_data)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60  # in seconds
    }


@router.post("/logout")
def logout():
    """
    Log out the current user and invalidate their session.

    Returns:
        dict: Success message
    """
    # For stateless JWT authentication, logout is typically handled on the client side
    # by removing the token. However, we can implement token blacklisting if needed.
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
def read_users_me(current_user: Dict = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Retrieve information about the currently authenticated user.

    Args:
        current_user (Dict): The currently authenticated user (from token)
        session (Session): Database session

    Returns:
        UserRead: Information about the current user
    """
    # Get the user from the database using the ID from the token
    user_id = current_user["user_id"]

    # Convert the user_id string to UUID if needed
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        # If user_id is already a UUID object or different format
        user_uuid = user_id

    db_user = get_user_by_id(session, user_uuid)

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Return the database user object which should match the UserRead schema
    return db_user