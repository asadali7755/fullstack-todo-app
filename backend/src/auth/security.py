from passlib.context import CryptContext

# Argon2 only - no bcrypt, no 72-byte limit
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a plaintext password. Only requires minimum 8 characters."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    return pwd_context.hash(password)
