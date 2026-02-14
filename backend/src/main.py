from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.todo_router import router as todos_router
from .api.auth_router import router as auth_router
from .api.chat_router import router as chat_router
from .middleware.logging_middleware import LoggingMiddleware
from .models.conversation import Conversation, Message  # noqa: F401 — triggers table creation
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Todo API",
    description="Backend API for Todo Full-Stack Web Application",
    version="1.0.0"
)

# Add logging middleware first
app.add_middleware(LoggingMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(todos_router, prefix="/todos", tags=["todos"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"message": "Todo API is running"}

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring the application status."""
    import time
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "todo-api"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)