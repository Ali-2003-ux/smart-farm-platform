from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from core import db, notifications

router = APIRouter()

class ForecastResponse(BaseModel):
    dates: List[str]
    health_values: List[float]
    yield_values: List[float]
    trend: str
    message: str

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(months: int = 6):
    df = db.get_all_surveys_df()
    
    if len(df) < 2:
        return ForecastResponse(
            dates=[], health_values=[], yield_values=[],
            trend="Insufficient Data",
            message="Need at least 2 scans to forecast."
        )
        
    # Logic reuse
    df['date_ordinal'] = pd.to_datetime(df['scan_date']).apply(lambda x: x.toordinal())
    
    X = df[['date_ordinal']]
    y = df['avg_health']
    
    model = LinearRegression()
    model.fit(X, y)
    
    last_date = pd.to_datetime(df['scan_date'].max())
    future_dates = []
    future_ordinals = []
    
    for i in range(1, months + 1):
        next_d = last_date + pd.Timedelta(days=30 * i)
        future_dates.append(next_d.strftime("%Y-%m-%d"))
        future_ordinals.append([next_d.toordinal()])
        
    pred_health = model.predict(future_ordinals)
    
    # Yield Logic (simplified)
    # Using last known total palms count
    current_count = df['total_palms'].iloc[-1] if not df.empty else 0
    yield_vals = []
    
    for h in pred_health:
        h_clamped = max(0, min(100, float(h)))
        y_tons = (current_count * (h_clamped / 100.0) * 80) / 1000.0
        yield_vals.append(round(y_tons, 2))

    slope = model.coef_[0]
    trend = "Stable"
    if slope > 0.05: trend = "Improving"
    elif slope < -0.05: trend = "Declining"
    
    return ForecastResponse(
        dates=future_dates,
        health_values=[round(float(h), 1) for h in pred_health],
        yield_values=yield_vals,
        trend=trend,
        message="Success"
    )

class StatsResponse(BaseModel):
    total_palms: int
    infected_palms: int
    avg_health: float
    yield_est: float
    last_scan: str

@router.get("/stats", response_model=StatsResponse)
def get_real_stats():
    # Get latest aggregate for scan date
    df_surveys = db.get_all_surveys_df()
    if df_surveys.empty:
        return StatsResponse(
            total_palms=0, infected_palms=0, avg_health=0.0, yield_est=0.0, last_scan="No Data"
        )
    latest_scan = df_surveys.iloc[-1]
    
    # Get detailed palm data for latest scan to count infected
    df_palms = db.get_latest_palms_df()
    infected_count = 0
    total_palms = 0
    
    if not df_palms.empty:
        total_palms = len(df_palms)
        scores = df_palms['health_score'].values
        if len(scores) > 0:
            mean_h = np.mean(scores)
            std_h = np.std(scores)
            thresh = mean_h - (0.5 * std_h)
            infected_count = np.sum(scores < thresh)
            
            # TRIGGER ALERT
            if infected_count > 0:
                msg = f"🚨 ALERT: {infected_count} Infected Palms Detected in Live Stats Analysis!"
                notifications.send_telegram_alert(msg)
            
    # Yield Logic
    h_factor = max(0, min(100, float(latest_scan['avg_health']))) / 100.0
    est_yield = (total_palms * h_factor * 80) / 1000.0
    
    return StatsResponse(
        total_palms=int(total_palms),
        infected_palms=int(infected_count),
        avg_health=round(float(latest_scan['avg_health']), 1),
        yield_est=round(est_yield, 2),
        last_scan=latest_scan['scan_date']
    )
