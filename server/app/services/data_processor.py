import io
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple, List

from app.services.parsers.registry import ParserRegistry

COLUMN_SYNONYMS = {
    "order_id": ["order id", "order_id", "id", "orderid", "transaction id", "transaction_id", "ord_id"],
    "order_date": ["order date", "order_date", "date", "orderdate", "transaction date", "sales date", "ord_date"],
    "customer_name": ["customer name", "customer_name", "customer", "customername", "client name", "client", "buyer", "cust_name"],
    "region": ["region", "zone", "area", "territory", "reg"],
    "state": ["state", "province", "region state", "dep", "state_province"],
    "city": ["city", "town", "municipality"],
    "category": ["category", "dept", "department", "class", "type", "cat"],
    "subcategory": ["sub category", "sub-category", "subcategory", "sub_category", "subclass", "subtype", "sub_cat"],
    "product_name": ["product name", "product_name", "product", "item name", "item_name", "productname", "item", "prod_name"],
    "sales": ["sales", "revenue", "turnover", "amount", "sales_amount", "price", "sale"],
    "profit": ["profit", "earnings", "net_income", "gain", "net profit", "prof"],
    "quantity": ["quantity", "qty", "units", "count", "number of items", "quant"],
    "discount": ["discount", "discount_rate", "rebate", "discounts", "disc"]
}

REQUIRED_KEYS = list(COLUMN_SYNONYMS.keys())

def clean_and_map_dataframe(df: pd.DataFrame, rows_before: int) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    # 1. Clean Column Names & Perform Synonym Mapping
    current_columns = [str(col).strip() for col in df.columns]
    mapped_columns = {}
    columns_to_rename = {}
    
    for key, synonyms in COLUMN_SYNONYMS.items():
        found = False
        for col in current_columns:
            cleaned_col = col.lower().replace("_", " ").replace("-", " ").strip()
            if cleaned_col == key or cleaned_col in synonyms:
                columns_to_rename[col] = key
                mapped_columns[key] = col
                found = True
                break
        if not found:
            # Try partial matching as fallback
            for col in current_columns:
                cleaned_col = col.lower().replace("_", " ").replace("-", " ").strip()
                for syn in synonyms:
                    if syn in cleaned_col or cleaned_col in syn:
                        columns_to_rename[col] = key
                        mapped_columns[key] = col
                        found = True
                        break
                if found:
                    break

    # Check for missing required columns
    missing_columns = [key.replace("_", " ").title() for key in REQUIRED_KEYS if key not in mapped_columns]
    if missing_columns:
        raise ValueError(f"Could not map required columns: {', '.join(missing_columns)}. Please ensure they exist.")

    # Rename columns to standard internal keys
    df.rename(columns=columns_to_rename, inplace=True)
    
    # Filter to only keep required columns
    df = df[REQUIRED_KEYS].copy()

    # 2. Data Cleaning
    # Remove complete empty rows
    df.dropna(how='all', inplace=True)
    
    # Remove duplicate records
    initial_len = len(df)
    df.drop_duplicates(inplace=True)
    duplicates_removed = initial_len - len(df)
    
    # Track missing values count
    missing_values_count = 0
    
    # Fill categorical missing values
    categorical_cols = ["order_id", "customer_name", "region", "state", "city", "category", "subcategory", "product_name"]
    for col in categorical_cols:
        missing_values_count += df[col].isna().sum()
        df[col] = df[col].fillna("Unknown").astype(str).str.strip()
        
    # Clean and parse dates
    # Invalid dates will trigger NaT and be classified as invalid records
    initial_date_rows = len(df)
    df['order_date'] = pd.to_datetime(df['order_date'], errors='coerce')
    date_failures = df['order_date'].isna().sum()
    df.dropna(subset=['order_date'], inplace=True)
    invalid_records = initial_date_rows - len(df)
    
    # Convert dates to standard Date objects
    df['order_date'] = df['order_date'].dt.date
    
    # Clean numeric columns
    numeric_cols = ["sales", "profit", "discount"]
    for col in numeric_cols:
        missing_values_count += df[col].isna().sum()
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
        
    # Quantity column
    missing_values_count += df['quantity'].isna().sum()
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(1.0).astype(int)
    
    # Discount formatting
    if df['discount'].max() > 1.0:
        df['discount'] = df['discount'] / 100.0

    rows_after = len(df)
    
    cleaning_report = {
        "rows_before": rows_before,
        "rows_after": rows_after,
        "duplicates_removed": int(duplicates_removed),
        "missing_values_filled": int(missing_values_count),
        "invalid_records": int(invalid_records),
        "final_usable_records": int(rows_after),
        "columns_mapped": {k: str(v) for k, v in mapped_columns.items()}
    }
    
    return df, cleaning_report

def process_file_upload(file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    # 1. Parse using Registry
    df, extension, mime_type = ParserRegistry.detect_and_parse(file_bytes, filename)
    
    if df.empty:
        raise ValueError("The uploaded file contains no data.")

    # 2. Normalize and clean
    df_clean, summary = clean_and_map_dataframe(df, len(df))
    summary["file_extension"] = extension
    summary["mime_type"] = mime_type
    
    return df_clean, summary

def generate_simulated_ocr_data(filename: str) -> pd.DataFrame:
    import random
    from datetime import date, timedelta
    
    regions = ["East", "West", "Central", "South"]
    states = {"East": "New York", "West": "California", "Central": "Texas", "South": "Florida"}
    cities = {"East": "New York City", "West": "Los Angeles", "Central": "Houston", "South": "Miami"}
    categories = {
        "Technology": ["Phones", "Accessories", "Copiers"],
        "Office Supplies": ["Paper", "Binders", "Art"],
        "Furniture": ["Chairs", "Tables", "Bookcases"]
    }
    products = {
        "Phones": "iPhone 14 Pro", "Accessories": "Wireless Hub", "Copiers": "Canon Laser Copier",
        "Paper": "Recycled A4 Paper", "Binders": "Ring Binder Folders", "Art": "Marker Art Kit",
        "Chairs": "Comfort Mesh Chair", "Tables": "Standing Board Desk", "Bookcases": "Birch Wooden Shelf"
    }
    customers = ["Alice Parker", "Marcus Vance", "Elena Rostova", "Devon Cole", "Sarah Jenkins"]
    
    data = []
    start_date = date(2024, 1, 1)
    
    for i in range(45):
        order_date = start_date + timedelta(days=random.randint(0, 500))
        region = random.choice(regions)
        cat = random.choice(list(categories.keys()))
        sub = random.choice(categories[cat])
        prod = products[sub]
        qty = random.randint(1, 6)
        sales = round(random.uniform(15.0, 320.0) * qty, 2)
        profit = round(sales * random.uniform(-0.1, 0.4), 2)
        discount = random.choice([0.0, 0.1, 0.25])
        
        data.append({
            "order_id": f"CA-OCR-{10000 + i}",
            "order_date": order_date,
            "customer_name": random.choice(customers),
            "region": region,
            "state": states[region],
            "city": cities[region],
            "category": cat,
            "subcategory": sub,
            "product_name": prod,
            "sales": sales,
            "profit": profit,
            "quantity": qty,
            "discount": discount
        })
    return pd.DataFrame(data)

def calculate_analytics_summary(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        return {}
        
    total_sales = float(df['sales'].sum())
    total_profit = float(df['profit'].sum())
    total_orders = int(df['order_id'].nunique())
    total_customers = int(df['customer_name'].nunique())
    avg_discount = float(df['discount'].mean())
    
    profit_margin = (total_profit / total_sales) if total_sales > 0 else 0
    aov = (total_sales / total_orders) if total_orders > 0 else 0
    clv = (total_sales / total_customers) * 3 if total_customers > 0 else 0
    
    region_perf = df.groupby('region')['sales'].sum()
    best_region = region_perf.idxmax() if not region_perf.empty else "N/A"
    worst_region = region_perf.idxmin() if not region_perf.empty else "N/A"
    
    cat_perf = df.groupby('category')['sales'].sum()
    best_category = cat_perf.idxmax() if not cat_perf.empty else "N/A"
    worst_category = cat_perf.idxmin() if not cat_perf.empty else "N/A"
    
    prod_perf = df.groupby('product_name')['profit'].sum()
    best_product = prod_perf.idxmax() if not prod_perf.empty else "N/A"
    worst_product = prod_perf.idxmin() if not prod_perf.empty else "N/A"

    return {
        "revenue": total_sales,
        "profit": total_profit,
        "aov": aov,
        "margin": profit_margin,
        "avgDiscount": avg_discount,
        "bestRegion": best_region,
        "worstRegion": worst_region,
        "bestCategory": best_category,
        "worstCategory": worst_category,
        "bestProduct": best_product,
        "worstProduct": worst_product,
        "clvApproximation": clv
    }
