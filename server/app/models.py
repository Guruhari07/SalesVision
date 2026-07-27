import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    uploads = relationship("UploadHistory", back_populates="user", cascade="all, delete-orphan")
    sales_records = relationship("SalesRecord", back_populates="user", cascade="all, delete-orphan")
    analytics_caches = relationship("AnalyticsCache", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("PredictionCache", back_populates="user", cascade="all, delete-orphan")

class UploadHistory(Base):
    __tablename__ = "upload_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    row_count = Column(Integer, nullable=False)
    cleaning_report = Column(Text, nullable=True)  # JSON-formatted cleaning log

    user = relationship("User", back_populates="uploads")
    sales_records = relationship("SalesRecord", back_populates="upload", cascade="all, delete-orphan")

class SalesRecord(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    upload_id = Column(Integer, ForeignKey("upload_history.id"), nullable=False)
    order_id = Column(String, index=True, nullable=False)
    order_date = Column(Date, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    region = Column(String, index=True, nullable=False)
    state = Column(String, nullable=False)
    city = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)
    subcategory = Column(String, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    sales = Column(Float, nullable=False)
    profit = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    discount = Column(Float, nullable=False)

    user = relationship("User", back_populates="sales_records")
    upload = relationship("UploadHistory", back_populates="sales_records")

class AnalyticsCache(Base):
    __tablename__ = "analytics_cache"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key = Column(String, index=True, nullable=False)  # e.g., 'dashboard_metrics', 'charts_data'
    value = Column(Text, nullable=False)              # JSON string
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="analytics_caches")

class PredictionCache(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_date = Column(Date, nullable=False)
    predicted_sales = Column(Float, nullable=False)
    predicted_profit = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=False)
    confidence_upper = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="predictions")
