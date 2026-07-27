import pandas as pd
import numpy as np
from typing import List, Dict, Any

def generate_ai_insights(df: pd.DataFrame) -> List[Dict[str, Any]]:
    if df.empty:
        return []
        
    insights = []
    
    total_sales = float(df['sales'].sum())
    total_profit = float(df['profit'].sum())
    overall_margin = (total_profit / total_sales) if total_sales > 0 else 0
    
    # 1. Monthly growth / MoM check
    df_copy = df.copy()
    df_copy['year_month'] = df_copy['order_date'].apply(lambda d: d.strftime('%Y-%m'))
    monthly = df_copy.groupby('year_month')['sales'].sum().sort_index()
    
    if len(monthly) >= 2:
        last_month = monthly.index[-1]
        prev_month = monthly.index[-2]
        last_val = monthly.iloc[-1]
        prev_val = monthly.iloc[-2]
        mom_growth = ((last_val - prev_val) / prev_val) * 100 if prev_val > 0 else 0
        
        direction = "increased" if mom_growth >= 0 else "decreased"
        ins_type = "positive" if mom_growth >= 0 else "warning"
        insights.append({
            "id": "mom_growth",
            "type": ins_type,
            "text": f"Sales {direction} by {abs(mom_growth):.1f}% in the latest month ({last_month}) compared to the previous month ({prev_month}).",
            "category": "Sales Growth"
        })
    else:
        insights.append({
            "id": "mom_growth_insufficient",
            "type": "info",
            "text": "Monthly sales tracking has started. More data is needed to show month-over-month growth trends.",
            "category": "Sales Growth"
        })

    # 2. Region analysis (Highest Revenue)
    region_sales = df.groupby('region')['sales'].sum()
    if not region_sales.empty:
        top_region = region_sales.idxmax()
        top_region_sales = region_sales.max()
        top_region_pct = (top_region_sales / total_sales) * 100 if total_sales > 0 else 0
        insights.append({
            "id": "top_region",
            "type": "positive",
            "text": f"The {top_region} region generated the highest revenue (₹{top_region_sales:,.2f}), contributing {top_region_pct:.1f}% of total sales.",
            "category": "Regions"
        })
        
        # Worst region analysis
        worst_region = region_sales.idxmin()
        worst_region_sales = region_sales.min()
        insights.append({
            "id": "worst_region",
            "type": "info",
            "text": f"The {worst_region} region was the lowest performing zone with ₹{worst_region_sales:,.2f} in sales.",
            "category": "Regions"
        })

    # 3. Category distribution
    cat_sales = df.groupby('category')['sales'].sum()
    cat_profits = df.groupby('category')['profit'].sum()
    if not cat_sales.empty:
        top_cat = cat_sales.idxmax()
        top_cat_pct = (cat_sales.max() / total_sales) * 100 if total_sales > 0 else 0
        insights.append({
            "id": "top_category",
            "type": "info",
            "text": f"The {top_cat} category dominates transaction volumes, contributing {top_cat_pct:.1f}% of total sales.",
            "category": "Category Analysis"
        })
        
        # Most profitable category
        if not cat_profits.empty:
            top_prof_cat = cat_profits.idxmax()
            top_prof_cat_profit = cat_profits.max()
            top_prof_cat_pct = (top_prof_cat_profit / total_profit) * 100 if total_profit > 0 else 0
            insights.append({
                "id": "top_profit_category",
                "type": "positive",
                "text": f"{top_prof_cat} is the primary profit driver, contributing {top_prof_cat_pct:.1f}% of overall business profits.",
                "category": "Category Analysis"
            })

    # 4. Low profit / high sales category check (operational efficiency)
    for cat in cat_sales.index:
        cat_s = cat_sales[cat]
        cat_p = cat_profits.get(cat, 0.0)
        cat_margin = (cat_p / cat_s) if cat_s > 0 else 0
        if cat_margin < 0.05 and cat_s > (total_sales * 0.1): # Low profit margin (<5%) but significant sales (>10% total)
            insights.append({
                "id": f"low_margin_{cat}",
                "type": "warning",
                "text": f"Warning: The {cat} category has high sales volume (₹{cat_s:,.2f}) but a very thin profit margin ({cat_margin*100:.1f}%), indicating high overhead or cost issues.",
                "category": "Profitability"
            })

    # 5. Discount correlation (Furniture discount impact / high discount warning)
    avg_discount = df['discount'].mean() * 100
    subcat_discount = df.groupby('subcategory').agg({'discount': 'mean', 'profit': 'sum', 'sales': 'sum'})
    if not subcat_discount.empty:
        heavy_discounted = subcat_discount[subcat_discount['discount'] > 0.2]
        for subcat, row in heavy_discounted.iterrows():
            subcat_margin = (row['profit'] / row['sales']) if row['sales'] > 0 else 0
            if subcat_margin < 0.02:
                insights.append({
                    "id": f"discount_warning_{subcat}",
                    "type": "warning",
                    "text": f"Subcategory '{subcat}' has aggressive discounts (avg {row['discount']*100:.1f}%) resulting in low profit margin ({subcat_margin*100:.1f}%). Consider optimizing pricing strategy.",
                    "category": "Pricing & Discounts"
                })

    # 6. Seasonality (Peak month)
    monthly_sales = df_copy.groupby(df_copy['order_date'].apply(lambda d: d.strftime('%B')))['sales'].sum()
    if not monthly_sales.empty:
        peak_month = monthly_sales.idxmax()
        peak_sales = monthly_sales.max()
        insights.append({
            "id": "seasonality_peak",
            "type": "positive",
            "text": f"Historical trends indicate that {peak_month} is the peak sales month, generating ₹{peak_sales:,.2f} in total revenue.",
            "category": "Seasonality"
        })

    # 7. Customer concentration risk
    cust_sales = df.groupby('customer_name')['sales'].sum()
    if not cust_sales.empty:
        top_cust = cust_sales.idxmax()
        top_cust_sales = cust_sales.max()
        top_cust_pct = (top_cust_sales / total_sales) * 100 if total_sales > 0 else 0
        if top_cust_pct > 5.0: # If a single customer makes up > 5% of revenue
            insights.append({
                "id": "customer_concentration",
                "type": "warning",
                "text": f"Customer concentration risk: Top buyer '{top_cust}' accounts for {top_cust_pct:.1f}% of total sales (₹{top_cust_sales:,.2f}).",
                "category": "Customers"
            })
        else:
            insights.append({
                "id": "top_customer_info",
                "type": "info",
                "text": f"Top customer '{top_cust}' has driven ₹{top_cust_sales:,.2f} in transaction sales.",
                "category": "Customers"
            })

    # 8. High average order value / transactions
    order_sizes = df.groupby('order_id')['sales'].sum()
    if not order_sizes.empty:
        aov = order_sizes.mean()
        max_order = order_sizes.max()
        insights.append({
            "id": "aov_insights",
            "type": "info",
            "text": f"Average order value (AOV) is ₹{aov:,.2f}, with the single largest transaction reaching ₹{max_order:,.2f}.",
            "category": "Transactions"
        })

    # 9. Profit Margin Status
    if overall_margin >= 0.15:
        insights.append({
            "id": "margin_status",
            "type": "positive",
            "text": f"Overall profit margin is strong at {overall_margin*100:.1f}%. The business operates with healthy overall unit economics.",
            "category": "Profitability"
        })
    elif overall_margin > 0:
        insights.append({
            "id": "margin_status",
            "type": "info",
            "text": f"Overall profit margin is moderate at {overall_margin*100:.1f}%. Opportunities exist to increase margins via price adjustments or discount caps.",
            "category": "Profitability"
        })
    else:
        insights.append({
            "id": "margin_status",
            "type": "warning",
            "text": f"Critical: Overall profit margin is negative ({overall_margin*100:.1f}%). Operational costs or pricing discounts are unsustainable.",
            "category": "Profitability"
        })

    # 10. Low order quantity alert
    avg_qty = df['quantity'].mean()
    insights.append({
        "id": "avg_qty_insight",
        "type": "info",
        "text": f"Customers purchase an average of {avg_qty:.1f} units per transaction line item.",
        "category": "Transactions"
    })

    # Ensure we return at least 10 insights by filling standard descriptions if necessary
    while len(insights) < 10:
        insights.append({
            "id": f"filler_insight_{len(insights)}",
            "type": "info",
            "text": f"Sales records spans {df['order_date'].nunique()} unique calendar dates across {df['state'].nunique()} states.",
            "category": "Coverage"
        })

    return insights[:12] # Limit to top 12 insights
