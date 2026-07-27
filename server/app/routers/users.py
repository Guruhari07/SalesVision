from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json

from app.core.database import get_db
from app.core.security import get_current_user, hash_password
from app.models import User, UploadHistory
from app.schemas import UserResponse, UploadHistoryResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.put("/profile", response_model=UserResponse)
def update_profile(
    full_name: Optional[str] = None,
    password: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if full_name is not None:
        current_user.full_name = full_name
    if password is not None:
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )
        current_user.hashed_password = hash_password(password)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/uploads", response_model=List[UploadHistoryResponse])
def get_upload_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uploads = db.query(UploadHistory).filter(UploadHistory.user_id == current_user.id).order_by(UploadHistory.uploaded_at.desc()).all()
    
    # Parse json cleaning report before response
    results = []
    for upload in uploads:
        report_data = {}
        if upload.cleaning_report:
            try:
                report_data = json.loads(upload.cleaning_report)
            except Exception:
                pass
        results.append(UploadHistoryResponse(
            id=upload.id,
            filename=upload.filename,
            uploaded_at=upload.uploaded_at,
            row_count=upload.row_count,
            cleaning_report=report_data
        ))
    return results
