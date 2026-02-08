from passlib.context import CryptContext
import logging

# Password hashing context - using argon2 which doesn't have the 72-byte limitation
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a plaintext password."""
    # Validate password length before hashing
    password_bytes = password.encode('utf-8')
    
    # Check if password is too short
    if len(password_bytes) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    
    logging.info(f"Attempting to hash password of length: {len(password.encode('utf-8'))} bytes")
    return pwd_context.hash(password)