from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas import PredictionItem
from app.routers.dashboard import get_user_df, get_cached_or_compute
from app.services.ml_predictor import predict_next_month

router = APIRouter(prefix="/prediction", tags=["Predictions"])

@router.get("", response_model=List[PredictionItem])
def get_predictions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    def compute():
        df = get_user_df(current_user.id, db)
        if df.empty:
            return []

        history, prediction = predict_next_month(df)
        
        # Merge history and prediction into a list matching PredictionItem schema
        results = []
        for h in history:
            results.append({
                "month": h["month"],
                "Sales": h["Sales"],
                "Profit": h["Profit"],
                "SalesLower": h["Sales"],
                "SalesUpper": h["Sales"],
                "ProfitLower": h["Profit"],
                "ProfitUpper": h["Profit"],
                "isPrediction": False
            })
            
        results.append({
            "month": prediction["month"],
            "Sales": prediction["Sales"],
            "Profit": prediction["Profit"],
            "SalesLower": prediction["SalesLower"],
            "SalesUpper": prediction["SalesUpper"],
            "ProfitLower": prediction["ProfitLower"],
            "ProfitUpper": prediction["ProfitUpper"],
            "isPrediction": True
        })
        
        return results

    data = get_cached_or_compute(current_user.id, "predictions_ml", db, compute)
    return data
