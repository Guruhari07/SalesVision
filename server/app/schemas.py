from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CleaningReport(BaseModel):
    rows_before: int
    rows_after: int
    duplicates_removed: int
    missing_values_filled: int
    invalid_records: int
    final_usable_records: int
    columns_mapped: Dict[str, str]
    file_extension: Optional[str] = None
    mime_type: Optional[str] = None

class UploadResponse(BaseModel):
    message: str
    upload_id: int
    filename: str
    row_count: int
    cleaning_report: CleaningReport

class KPICardData(BaseModel):
    value: float
    percentageChange: float
    trend: str  # 'up' | 'down' | 'neutral'

class DashboardMetrics(BaseModel):
    totalSales: KPICardData
    totalProfit: KPICardData
    totalOrders: KPICardData
    totalCustomers: KPICardData
    profitMargin: KPICardData
    growthSales: float
    growthProfit: float

class ChartDataPoint(BaseModel):
    month: str
    Sales: float
    Profit: float
    isPrediction: Optional[bool] = False
    SalesLower: Optional[float] = None
    SalesUpper: Optional[float] = None
    ProfitLower: Optional[float] = None
    ProfitUpper: Optional[float] = None

class RegionSalesData(BaseModel):
    region: str
    sales: float
    profit: float

class CategorySalesData(BaseModel):
    category: str
    sales: float
    profit: float

class SubcategorySalesData(BaseModel):
    subcategory: str
    sales: float
    profit: float

class ProductPerformance(BaseModel):
    product_name: str
    category: str
    sales: float
    profit: float
    quantity: int

class CustomerPerformance(BaseModel):
    customer_name: str
    sales: float
    profit: float
    orders: int

class HeatmapDataPoint(BaseModel):
    region: str
    category: str
    sales: float

class DistributionDataPoint(BaseModel):
    profit_range: str
    order_count: int

class QuantityDataPoint(BaseModel):
    quantity_range: str
    order_count: int

class ChartsData(BaseModel):
    monthlyTrends: List[ChartDataPoint]
    regionSales: List[RegionSalesData]
    categorySales: List[CategorySalesData]
    subcategorySales: List[SubcategorySalesData]
    topProducts: List[ProductPerformance]
    topCustomers: List[CustomerPerformance]
    heatmapData: List[HeatmapDataPoint]
    profitDistribution: List[DistributionDataPoint]
    quantityAnalysis: List[QuantityDataPoint]

class AnalyticsOverview(BaseModel):
    revenue: float
    profit: float
    aov: float
    margin: float
    avgDiscount: float
    bestRegion: str
    worstRegion: str
    bestCategory: str
    worstCategory: str
    bestProduct: str
    worstProduct: str
    clvApproximation: float

class PredictionItem(BaseModel):
    month: str
    Sales: float
    Profit: float
    SalesLower: float
    SalesUpper: float
    ProfitLower: float
    ProfitUpper: float
    isPrediction: bool

class InsightItem(BaseModel):
    id: str
    type: str  # 'positive', 'warning', 'info'
    text: str
    category: str

class UploadHistoryResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime.datetime
    row_count: int
    cleaning_report: Dict[str, Any]

    class Config:
        from_attributes = True
