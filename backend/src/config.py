"""Configuration settings for the Todo API."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./todo_app.db")
    DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "5"))
    DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))

    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # Application settings
    APP_NAME: str = os.getenv("APP_NAME", "Todo API")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # API settings
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: str = os.getenv("BACKEND_CORS_ORIGINS", "*")

    # Performance settings
    MAX_TODO_TITLE_LENGTH: int = 255
    MAX_TODO_DESCRIPTION_LENGTH: int = 1000
    DEFAULT_PAGE_LIMIT: int = 50
    MAX_PAGE_LIMIT: int = 100
    
    # Cohere settings
    COHERE_API_KEY: str = os.getenv("COHERE_API_KEY", "")

    # Rate limiting settings
    RATE_LIMIT_ATTEMPTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_ATTEMPTS_PER_MINUTE", "5"))
    RATE_LIMIT_WINDOW_MINUTES: int = int(os.getenv("RATE_LIMIT_WINDOW_MINUTES", "1"))

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()