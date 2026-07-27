from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import pandas as pd

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.routers.dashboard import get_user_df

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/export/csv")
def export_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    df = get_user_df(current_user.id, db)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sales data found to export. Please upload a CSV first."
        )

    # Convert to CSV string
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    # Reset stream pointer
    mem_file = io.BytesIO()
    mem_file.write(stream.getvalue().encode('utf-8'))
    mem_file.seek(0)
    
    return StreamingResponse(
        mem_file,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_report_export.csv"}
    )

@router.get("/export/excel")
def export_excel(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    df = get_user_df(current_user.id, db)
    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sales data found to export. Please upload a CSV first."
        )

    # Convert to Excel Bytes via OpenPyXL
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Sales Records')
        
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=sales_report_export.xlsx"}
    )
