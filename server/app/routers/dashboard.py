from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import json
import datetime
from typing import Dict, Any, List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, SalesRecord, AnalyticsCache
from app.schemas import DashboardMetrics, ChartsData, KPICardData, ChartDataPoint, RegionSalesData, CategorySalesData, SubcategorySalesData, ProductPerformance, CustomerPerformance, HeatmapDataPoint, DistributionDataPoint, QuantityDataPoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_user_df(user_id: int, db: Session) -> pd.DataFrame:
    records = db.query(SalesRecord).filter(SalesRecord.user_id == user_id).all()
    if not records:
        return pd.DataFrame()
    data = []
    for r in records:
        data.append({
            'order_id': r.order_id,
            'order_date': r.order_date,
            'customer_name': r.customer_name,
            'region': r.region,
            'state': r.state,
            'city': r.city,
            'category': r.category,
            'subcategory': r.subcategory,
            'product_name': r.product_name,
            'sales': r.sales,
            'profit': r.profit,
            'quantity': r.quantity,
            'discount': r.discount
        })
    df = pd.DataFrame(data)
    df['order_date'] = pd.to_datetime(df['order_date'])
    return df

def get_cached_or_compute(user_id: int, key: str, db: Session, compute_func) -> Any:
    # Look for cached entry
    cached = db.query(AnalyticsCache).filter(
        AnalyticsCache.user_id == user_id,
        AnalyticsCache.key == key
    ).first()
    
    if cached:
        # Check expiration (e.g. 1 hour)
        age = datetime.datetime.utcnow() - cached.updated_at
        if age.total_seconds() < 3600:
            return json.loads(cached.value)
            
    # Compute
    data = compute_func()
    
    if cached:
        cached.value = json.dumps(data)
        cached.updated_at = datetime.datetime.utcnow()
    else:
        cached = AnalyticsCache(user_id=user_id, key=key, value=json.dumps(data))
        db.add(cached)
        
    db.commit()
    return data

@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    def compute():
        df = get_user_df(current_user.id, db)
        if df.empty:
            empty_kpi = KPICardData(value=0, percentageChange=0, trend="neutral")
            return {
                "totalSales": empty_kpi.dict(),
                "totalProfit": empty_kpi.dict(),
                "totalOrders": empty_kpi.dict(),
                "totalCustomers": empty_kpi.dict(),
                "profitMargin": empty_kpi.dict(),
                "growthSales": 0.0,
                "growthProfit": 0.0
            }

        # Calculate metrics
        total_sales = float(df['sales'].sum())
        total_profit = float(df['profit'].sum())
        total_orders = int(df['order_id'].nunique())
        total_customers = int(df['customer_name'].nunique())
        margin = (total_profit / total_sales) * 100 if total_sales > 0 else 0

        # Calculate MoM changes
        df['year_month'] = df['order_date'].dt.to_period('M')
        monthly = df.groupby('year_month').agg({
            'sales': 'sum',
            'profit': 'sum',
            'order_id': 'nunique',
            'customer_name': 'nunique'
        }).sort_index()

        sales_pct = profit_pct = orders_pct = customers_pct = margin_pct = 0.0
        
        if len(monthly) >= 2:
            cur = monthly.iloc[-1]
            prev = monthly.iloc[-2]
            
            sales_pct = ((cur['sales'] - prev['sales']) / prev['sales'] * 100) if prev['sales'] > 0 else 0
            profit_pct = ((cur['profit'] - prev['profit']) / prev['profit'] * 100) if prev['profit'] > 0 else 0
            orders_pct = ((cur['order_id'] - prev['order_id']) / prev['order_id'] * 100) if prev['order_id'] > 0 else 0
            customers_pct = ((cur['customer_name'] - prev['customer_name']) / prev['customer_name'] * 100) if prev['customer_name'] > 0 else 0
            
            cur_margin = (cur['profit'] / cur['sales'] * 100) if cur['sales'] > 0 else 0
            prev_margin = (prev['profit'] / prev['sales'] * 100) if prev['sales'] > 0 else 0
            margin_pct = cur_margin - prev_margin # Direct basis points difference
            
        def get_trend(val):
            return "up" if val > 0.01 else ("down" if val < -0.01 else "neutral")

        return {
            "totalSales": {
                "value": total_sales,
                "percentageChange": float(sales_pct),
                "trend": get_trend(sales_pct)
            },
            "totalProfit": {
                "value": total_profit,
                "percentageChange": float(profit_pct),
                "trend": get_trend(profit_pct)
            },
            "totalOrders": {
                "value": float(total_orders),
                "percentageChange": float(orders_pct),
                "trend": get_trend(orders_pct)
            },
            "totalCustomers": {
                "value": float(total_customers),
                "percentageChange": float(customers_pct),
                "trend": get_trend(customers_pct)
            },
            "profitMargin": {
                "value": margin,
                "percentageChange": float(margin_pct),
                "trend": get_trend(margin_pct)
            },
            "growthSales": float(sales_pct),
            "growthProfit": float(profit_pct)
        }

    data = get_cached_or_compute(current_user.id, "dashboard_metrics", db, compute)
    return data

@router.get("/charts", response_model=ChartsData)
def get_charts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    def compute():
        df = get_user_df(current_user.id, db)
        if df.empty:
            return {
                "monthlyTrends": [],
                "regionSales": [],
                "categorySales": [],
                "subcategorySales": [],
                "topProducts": [],
                "topCustomers": [],
                "heatmapData": [],
                "profitDistribution": [],
                "quantityAnalysis": []
            }

        # 1. Monthly Trends
        df['year_month'] = df['order_date'].dt.to_period('M')
        monthly = df.groupby('year_month').agg({'sales': 'sum', 'profit': 'sum'}).sort_index()
        monthly_trends = []
        for ym, row in monthly.iterrows():
            monthly_trends.append({
                "month": str(ym),
                "Sales": float(row['sales']),
                "Profit": float(row['profit']),
                "isPrediction": False
            })

        # 2. Region Sales
        region = df.groupby('region').agg({'sales': 'sum', 'profit': 'sum'}).reset_index()
        region_sales = [
            {"region": str(row['region']), "sales": float(row['sales']), "profit": float(row['profit'])}
            for _, row in region.iterrows()
        ]

        # 3. Category Sales
        category = df.groupby('category').agg({'sales': 'sum', 'profit': 'sum'}).reset_index()
        category_sales = [
            {"category": str(row['category']), "sales": float(row['sales']), "profit": float(row['profit'])}
            for _, row in category.iterrows()
        ]

        # 4. Subcategory Sales
        subcat = df.groupby('subcategory').agg({'sales': 'sum', 'profit': 'sum'}).reset_index()
        subcategory_sales = [
            {"subcategory": str(row['subcategory']), "sales": float(row['sales']), "profit": float(row['profit'])}
            for _, row in subcat.iterrows()
        ]

        # 5. Top Products
        products = df.groupby(['product_name', 'category']).agg({
            'sales': 'sum',
            'profit': 'sum',
            'quantity': 'sum'
        }).reset_index().sort_values(by='sales', ascending=False).head(10)
        
        top_products = [
            {
                "product_name": str(row['product_name']),
                "category": str(row['category']),
                "sales": float(row['sales']),
                "profit": float(row['profit']),
                "quantity": int(row['quantity'])
            }
            for _, row in products.iterrows()
        ]

        # 6. Top Customers
        customers = df.groupby('customer_name').agg({
            'sales': 'sum',
            'profit': 'sum',
            'order_id': 'nunique'
        }).reset_index().sort_values(by='sales', ascending=False).head(10)
        
        top_customers = [
            {
                "customer_name": str(row['customer_name']),
                "sales": float(row['sales']),
                "profit": float(row['profit']),
                "orders": int(row['order_id'])
            }
            for _, row in customers.iterrows()
        ]

        # 7. Heatmap Data (Region vs Category Sales)
        heatmap = df.groupby(['region', 'category'])['sales'].sum().reset_index()
        heatmap_data = [
            {"region": str(row['region']), "category": str(row['category']), "sales": float(row['sales'])}
            for _, row in heatmap.iterrows()
        ]

        # 8. Profit Distribution
        # Define bounds
        bins = [-np.inf, -100, 0, 100, 500, np.inf]
        labels = ["High Loss (< -$100)", "Minor Loss (-$100 to $0)", "Low Profit ($0-$100)", "Medium Profit ($100-$500)", "High Profit (>$500)"]
        df['profit_range'] = pd.cut(df['profit'], bins=bins, labels=labels)
        profit_dist = df.groupby('profit_range', observed=False).size().reset_index(name='count')
        
        profit_distribution = [
            {"profit_range": str(row['profit_range']), "order_count": int(row['count'])}
            for _, row in profit_dist.iterrows()
        ]

        # 9. Quantity Analysis
        qty_bins = [0, 1, 2, 5, 10, np.inf]
        qty_labels = ["1 Unit", "2 Units", "3-5 Units", "6-10 Units", "10+ Units"]
        df['quantity_range'] = pd.cut(df['quantity'], bins=qty_bins, labels=qty_labels)
        qty_dist = df.groupby('quantity_range', observed=False).size().reset_index(name='count')
        
        quantity_analysis = [
            {"quantity_range": str(row['quantity_range']), "order_count": int(row['count'])}
            for _, row in qty_dist.iterrows()
        ]

        return {
            "monthlyTrends": monthly_trends,
            "regionSales": region_sales,
            "categorySales": category_sales,
            "subcategorySales": subcategory_sales,
            "topProducts": top_products,
            "topCustomers": top_customers,
            "heatmapData": heatmap_data,
            "profitDistribution": profit_distribution,
            "quantityAnalysis": quantity_analysis
        }

    data = get_cached_or_compute(current_user.id, "dashboard_charts", db, compute)
    return data

@router.get("/raw")
def get_raw_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(SalesRecord).filter(SalesRecord.user_id == current_user.id).all()
    return [
        {
            "order_id": r.order_id,
            "order_date": str(r.order_date),
            "customer_name": r.customer_name,
            "region": r.region,
            "state": r.state,
            "city": r.city,
            "category": r.category,
            "subcategory": r.subcategory,
            "product_name": r.product_name,
            "sales": r.sales,
            "profit": r.profit,
            "quantity": r.quantity,
            "discount": r.discount
        }
        for r in records
    ]

