from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import jwt

from google.oauth2 import id_token
from google.auth.transport import requests

from config import settings
from db.database import get_db
from db.models import User
from dependencies import get_current_user
from utils.logger import logger

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class GoogleLoginRequest(BaseModel):
    credential: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt

@router.post("/google", response_model=TokenResponse)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify the Google ID token
        id_info = id_token.verify_oauth2_token(
            request.credential, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        google_id = id_info['sub']
        email = id_info['email']
        name = id_info.get('name', 'User')
        picture = id_info.get('picture')

        # Check if user exists
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Create new user
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                profile_picture=picture
            )
            db.add(user)
        else:
            # Update existing user's last login and details
            user.last_login = datetime.now(timezone.utc)
            user.name = name
            user.profile_picture = picture
            
        db.commit()
        db.refresh(user)

        # Generate our own JWT access token for session management
        access_token_expires = timedelta(days=7) # Persist login for 7 days
        access_token = create_access_token(
            data={"sub": user.id}, 
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "picture": user.profile_picture,
                "optimizations_used": user.resume_optimizations_used,
                "subscription_type": user.subscription_type
            }
        }
        
    except ValueError as e:
        logger.error(f"Google Token Verification Failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during login")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "picture": current_user.profile_picture,
        "optimizations_used": current_user.resume_optimizations_used,
        "subscription_type": current_user.subscription_type
    }
