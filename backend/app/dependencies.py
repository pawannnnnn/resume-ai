from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from typing import Annotated

from config import settings
from db.database import get_db
from db.models import User

# Using OAuth2PasswordBearer to extract the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/google")

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)]
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token issued by our backend
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def verify_quota(
    user: Annotated[User, Depends(get_current_user)]
):
    """
    Dependency to check if the user has free optimizations remaining.
    Throws 403 Forbidden if quota is exhausted.
    """
    # Pro users have unlimited optimizations (skip check if subscription is 'pro')
    if user.subscription_type == "pro":
        return user
        
    MAX_OPTIMIZATIONS = 5
    if user.resume_optimizations_used >= MAX_OPTIMIZATIONS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free optimization limit reached"
        )
        
    return user
