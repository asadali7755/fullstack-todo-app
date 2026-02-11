from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from ..config import settings

# Use consistent settings from config (reads from .env SECRET_KEY)
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token with the given data and expiration time.

    Args:
        data (dict): The data to encode in the token (typically user info)
        expires_delta (timedelta, optional): The time until the token expires

    Returns:
        str: The encoded JWT token
    """
    to_encode = data.copy()

    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})

    # Encode the token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT refresh token with the given data and expiration time.

    Args:
        data (dict): The data to encode in the token (typically user info)
        expires_delta (timedelta, optional): The time until the token expires

    Returns:
        str: The encoded JWT token
    """
    to_encode = data.copy()

    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})

    # Encode the token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify a JWT token and return the payload if valid.

    Args:
        token (str): The JWT token to verify

    Returns:
        dict: The decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Check if token is expired
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
            return None

        return payload
    except JWTError:
        return None


def extract_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract the user ID from a JWT token.

    Args:
        token (str): The JWT token to extract user ID from

    Returns:
        str: The user ID if found and token is valid, None otherwise
    """
    payload = verify_token(token)
    if payload:
        return payload.get("sub")  # "sub" is the standard claim for subject/user ID
    return None


def extract_email_from_token(token: str) -> Optional[str]:
    """
    Extract the email from a JWT token.

    Args:
        token (str): The JWT token to extract email from

    Returns:
        str: The email if found and token is valid, None otherwise
    """
    payload = verify_token(token)
    if payload:
        return payload.get("email")
    return None


def is_access_token(token: str) -> bool:
    """
    Check if the given token is an access token.

    Args:
        token (str): The JWT token to check

    Returns:
        bool: True if it's an access token, False otherwise
    """
    payload = verify_token(token)
    if payload:
        return payload.get("type") == "access"
    return False


def is_refresh_token(token: str) -> bool:
    """
    Check if the given token is a refresh token.

    Args:
        token (str): The JWT token to check

    Returns:
        bool: True if it's a refresh token, False otherwise
    """
    payload = verify_token(token)
    if payload:
        return payload.get("type") == "refresh"
    return False