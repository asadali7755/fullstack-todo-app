"""Conversation and Message models for chat persistence."""

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class Conversation(SQLModel, table=True):
    """Represents a chat session owned by a single user."""
    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(nullable=False, index=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)

    messages: List["Message"] = Relationship(back_populates="conversation")


class Message(SQLModel, table=True):
    """Represents a single message within a conversation."""
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", nullable=False, index=True)
    user_id: str = Field(nullable=False, index=True)
    role: str = Field(nullable=False)  # 'user' or 'assistant'
    content: str = Field(nullable=False)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=False)

    conversation: Optional[Conversation] = Relationship(back_populates="messages")


class ToolCallInfo(BaseModel):
    """Schema for tool call information in chat responses."""
    tool: str
    arguments: dict
    result: dict


class ChatRequest(BaseModel):
    """Schema for incoming chat messages."""
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    """Schema for chat endpoint responses."""
    conversation_id: int
    message_id: int
    response: str
    tool_calls: List[ToolCallInfo] = []
