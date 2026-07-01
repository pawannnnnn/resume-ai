from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os

from db.database import get_db
from db.models import User
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Comma-separated list of admin emails in environment variables
def is_admin(current_user: User = Depends(get_current_user)):
    admin_emails = os.getenv("ADMIN_EMAILS", "").split(",")
    if current_user.email not in admin_emails and current_user.subscription_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

class QuotaUpdateRequest(BaseModel):
    user_id: int
    new_used_count: int

@router.get("/users")
def get_all_users(admin: User = Depends(is_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "name": u.name, "optimizations_used": u.resume_optimizations_used, "subscription_type": u.subscription_type} for u in users]

@router.post("/update_quota")
def update_quota(request: QuotaUpdateRequest, admin: User = Depends(is_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.resume_optimizations_used = request.new_used_count
    db.commit()
    
    return {"message": "Quota updated successfully", "user_id": user.id, "optimizations_used": user.resume_optimizations_used}

@router.post("/reset_quota/{user_id}")
def reset_quota(user_id: int, admin: User = Depends(is_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.resume_optimizations_used = 0
    db.commit()
    
    return {"message": "Quota reset successfully", "user_id": user.id}
