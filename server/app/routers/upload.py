from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, UploadHistory, SalesRecord, AnalyticsCache, PredictionCache
from app.schemas import UploadResponse, CleaningReport
from app.services.data_processor import process_file_upload

router = APIRouter(prefix="/upload", tags=["Upload"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Read bytes
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}"
        )

    # 2. Validate file size (10MB limit)
    file_size = len(contents)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the 10MB limit (size: {file_size / (1024 * 1024):.2f}MB)."
        )

    # 3. Clean and map data using general registry parser
    try:
        df, cleaning_report = process_file_upload(contents, file.filename)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning and parsing file: {str(e)}"
        )

    # 4. Remove previous user data (so the dashboard reflects the new file accurately)
    try:
        db.query(SalesRecord).filter(SalesRecord.user_id == current_user.id).delete()
        db.query(AnalyticsCache).filter(AnalyticsCache.user_id == current_user.id).delete()
        db.query(PredictionCache).filter(PredictionCache.user_id == current_user.id).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear previous dashboard cache: {str(e)}"
        )

    # 5. Save upload history metadata
    upload_history = UploadHistory(
        user_id=current_user.id,
        filename=file.filename,
        row_count=len(df),
        cleaning_report=json.dumps(cleaning_report)
    )
    db.add(upload_history)
    db.commit()
    db.refresh(upload_history)

    # 6. Bulk insert sales records in batches for high database performance
    sales_records = []
    for _, row in df.iterrows():
        sales_records.append(
            SalesRecord(
                user_id=current_user.id,
                upload_id=upload_history.id,
                order_id=str(row['order_id']),
                order_date=row['order_date'],
                customer_name=str(row['customer_name']),
                region=str(row['region']),
                state=str(row['state']),
                city=str(row['city']),
                category=str(row['category']),
                subcategory=str(row['subcategory']),
                product_name=str(row['product_name']),
                sales=float(row['sales']),
                profit=float(row['profit']),
                quantity=int(row['quantity']),
                discount=float(row['discount'])
            )
        )

    try:
        # Perform bulk insert
        db.bulk_save_objects(sales_records)
        db.commit()
    except Exception as e:
        db.rollback()
        # Delete history item if upload fails
        db.delete(upload_history)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save sales data records: {str(e)}"
        )

    report_pydantic = CleaningReport(
        rows_before=cleaning_report["rows_before"],
        rows_after=cleaning_report["rows_after"],
        duplicates_removed=cleaning_report["duplicates_removed"],
        missing_values_filled=cleaning_report["missing_values_filled"],
        invalid_records=cleaning_report["invalid_records"],
        final_usable_records=cleaning_report["final_usable_records"],
        columns_mapped=cleaning_report["columns_mapped"],
        file_extension=cleaning_report.get("file_extension"),
        mime_type=cleaning_report.get("mime_type")
    )

    return UploadResponse(
        message="File uploaded and parsed successfully.",
        upload_id=upload_history.id,
        filename=file.filename,
        row_count=len(df),
        cleaning_report=report_pydantic
    )
