from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas import AnalyticsOverview
from app.routers.dashboard import get_user_df, get_cached_or_compute
from app.services.data_processor import calculate_analytics_summary

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    def compute():
        df = get_user_df(current_user.id, db)
        if df.empty:
            return {
                "revenue": 0.0,
                "profit": 0.0,
                "aov": 0.0,
                "margin": 0.0,
                "avgDiscount": 0.0,
                "bestRegion": "N/A",
                "worstRegion": "N/A",
                "bestCategory": "N/A",
                "worstCategory": "N/A",
                "bestProduct": "N/A",
                "worstProduct": "N/A",
                "clvApproximation": 0.0
            }
        
        return calculate_analytics_summary(df)

    data = get_cached_or_compute(current_user.id, "analytics_overview", db, compute)
    return data
