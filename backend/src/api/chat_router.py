"""Chat API router: POST /api/chat endpoint."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..database import get_session
from ..api.auth_dependencies import get_current_user
from ..models.user import User
from ..models.conversation import ChatRequest, ChatResponse
from ..services.chat_service import process_chat_message

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Send a chat message and receive an AI-powered response.

    The agent interprets the message and invokes MCP tools to manage tasks.
    """
    user_id = str(current_user.id)

    # Validate message length (Pydantic handles min/max but double-check)
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required and must be 1-10000 characters",
        )

    # Validate conversation_id is positive if provided
    if request.conversation_id is not None and request.conversation_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="conversation_id must be a positive integer",
        )

    try:
        result = await process_chat_message(
            user_id=user_id,
            message=request.message.strip(),
            conversation_id=request.conversation_id,
            session=session,
        )
        return ChatResponse(**result)

    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conversation does not belong to the authenticated user",
        )
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your message. Please try again.",
        )
    except Exception:
        logger.exception("Unexpected error in chat endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your message. Please try again.",
        )
