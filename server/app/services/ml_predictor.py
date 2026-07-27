import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from typing import Dict, List, Any, Tuple

def next_month_str(last_month_str: str) -> str:
    try:
        y, m = map(int, last_month_str.split('-'))
        if m == 12:
            return f"{y+1}-01"
        else:
            return f"{y}-{m+1:02d}"
    except Exception:
        # Fallback in case of weird formatting
        return "Next Month"

def predict_next_month(df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    # 1. Monthly Aggregation
    df_copy = df.copy()
    df_copy['year_month'] = df_copy['order_date'].apply(lambda d: d.strftime('%Y-%m'))
    monthly = df_copy.groupby('year_month').agg({'sales': 'sum', 'profit': 'sum'}).sort_index()
    
    historical_data: List[Dict[str, Any]] = []
    for month, row in monthly.iterrows():
        historical_data.append({
            "month": str(month),
            "Sales": float(row['sales']),
            "Profit": float(row['profit']),
            "isPrediction": False
        })
        
    if len(monthly) < 2:
        # Not enough data to predict, return static fallback
        fallback_sales = float(df['sales'].sum() / 3) if not df.empty else 0.0
        fallback_profit = float(df['profit'].sum() / 3) if not df.empty else 0.0
        last_m = str(monthly.index[-1]) if not monthly.empty else "2026-07"
        nxt_m = next_month_str(last_m)
        
        prediction = {
            "month": nxt_m,
            "Sales": fallback_sales,
            "Profit": fallback_profit,
            "SalesLower": max(0.0, fallback_sales * 0.7),
            "SalesUpper": fallback_sales * 1.3,
            "ProfitLower": fallback_profit * 0.7,
            "ProfitUpper": fallback_profit * 1.3,
            "isPrediction": True
        }
        return historical_data, prediction

    # 2. Extract features and targets
    X = np.arange(len(monthly)).reshape(-1, 1)
    y_sales = monthly['sales'].values
    y_profit = monthly['profit'].values

    # Fit linear regressions
    model_sales = LinearRegression()
    model_sales.fit(X, y_sales)
    
    model_profit = LinearRegression()
    model_profit.fit(X, y_profit)

    # Predict next step
    next_idx = len(monthly)
    pred_sales = float(model_sales.predict([[next_idx]])[0])
    pred_profit = float(model_profit.predict([[next_idx]])[0])

    # Calculate residuals and confidence intervals
    # Residual Standard Deviation
    residuals_sales = y_sales - model_sales.predict(X)
    std_sales = np.std(residuals_sales)
    if std_sales == 0:
        std_sales = pred_sales * 0.15 # Fallback standard deviation
        
    residuals_profit = y_profit - model_profit.predict(X)
    std_profit = np.std(residuals_profit)
    if std_profit == 0:
        std_profit = abs(pred_profit) * 0.15 # Fallback standard deviation

    # 95% Confidence Interval (Z=1.96)
    sales_lower = max(0.0, pred_sales - 1.96 * std_sales)
    sales_upper = pred_sales + 1.96 * std_sales
    
    profit_lower = pred_profit - 1.96 * std_profit
    profit_upper = pred_profit + 1.96 * std_profit

    last_month = str(monthly.index[-1])
    next_month = next_month_str(last_month)

    prediction = {
        "month": next_month,
        "Sales": max(0.0, pred_sales),
        "Profit": pred_profit,
        "SalesLower": sales_lower,
        "SalesUpper": sales_upper,
        "ProfitLower": profit_lower,
        "ProfitUpper": profit_upper,
        "isPrediction": True
    }

    return historical_data, prediction
