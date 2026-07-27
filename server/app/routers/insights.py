from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas import InsightItem
from app.routers.dashboard import get_user_df, get_cached_or_compute
from app.services.insight_generator import generate_ai_insights

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("", response_model=List[InsightItem])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    def compute():
        df = get_user_df(current_user.id, db)
        if df.empty:
            return []
        
        return generate_ai_insights(df)

    data = get_cached_or_compute(current_user.id, "ai_insights", db, compute)
    return data
