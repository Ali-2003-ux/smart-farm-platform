from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from core import db, notifications

router = APIRouter()

# --- Data Models ---

class ForecastResponse(BaseModel):
    dates: List[str]
    health_values: List[float]
    yield_values: List[float]
    trend: str
    message: str

class StatsResponse(BaseModel):
    total_palms: int
    infected_palms: int
    avg_health: float
    yield_est: float
    last_scan: str

class SurveySummary(BaseModel):
    id: int
    date: str
    count: int
    health: float

class PalmDetail(BaseModel):
    id: int
    custom_name: Optional[str]
    lat: float
    lon: float
    status: str
    health_history: List[dict] # [{date, score}, ...]

class FinanceConfig(BaseModel):
    oil_price: float
    fertilizer_cost: float
    labor_cost: float

class FinanceResponse(BaseModel):
    revenue: float
    yield_tons: float
    config: dict
    roi_percentage: float
    carbon_credits: float

class TaskCreate(BaseModel):
    target_palm_id: int
    task_type: str
    priority: str = "Medium"

# --- Endpoints ---

@router.get("/reports/history", response_model=List[SurveySummary])
def get_reports_history():
    surveys = db.get_survey_history()
    return [SurveySummary(
        id=s['id'], 
        date=s['date'], 
        count=s['count'], 
        health=s['health']
    ) for s in surveys]

@router.get("/palm/{palm_id}", response_model=PalmDetail)
def get_palm_detail(palm_id: int):
    conn = db.get_connection()
    c = conn.cursor()
    try:
        # Get Palm Info
        c.execute("SELECT id, custom_name, lat, lon, status FROM tracked_palms WHERE id = ?", (palm_id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Palm not found")
        
        # Get History
        c.execute("""
            SELECT s.scan_date, ph.health_score 
            FROM palm_history ph
            JOIN surveys s ON ph.survey_id = s.id
            WHERE ph.tracked_palm_id = ?
            ORDER BY s.scan_date ASC
        """, (palm_id,))
        history = [{"date": r[0], "score": r[1]} for r in c.fetchall()]
        
        return PalmDetail(
            id=row[0],
            custom_name=row[1],
            lat=row[2],
            lon=row[3],
            status=row[6] if len(row) > 6 else 'Unknown', # Handle case if logic changes
            health_history=history
        )
    finally:
        conn.close()

@router.get("/finance/roi", response_model=FinanceResponse)
def get_finance_roi():
    metrics = db.get_financial_metrics()
    
    revenue = metrics['revenue']
    costs = 0 # Placeholder for dynamic cost calc
    
    # Calculate costs based on tasks/inputs (Mock for now or use config)
    fert_cost = metrics['config'].get('fertilizer_cost_per_kg', 0) * 1000 # Mock quantity
    
    profit = revenue - fert_cost
    roi = (profit / fert_cost * 100) if fert_cost > 0 else 0
    
    # Traceability / Carbon Credit Mock
    # 1 Palm = ~0.5 ton CO2/year
    carbon = metrics['yield_tons'] * 2.5 # multiplier
    
    return FinanceResponse(
        revenue=revenue,
        yield_tons=metrics['yield_tons'],
        config=metrics['config'],
        roi_percentage=round(roi, 2),
        carbon_credits=round(carbon, 2)
    )

@router.post("/finance/config")
def update_finance_config(config: FinanceConfig):
    conn = db.get_connection()
    c = conn.cursor()
    try:
        c.execute("INSERT OR REPLACE INTO financial_config (key, value, updated_at) VALUES (?, ?, ?)",
                  ('oil_price_per_ton', config.oil_price, "now"))
        c.execute("INSERT OR REPLACE INTO financial_config (key, value, updated_at) VALUES (?, ?, ?)",
                  ('fertilizer_cost_per_kg', config.fertilizer_cost, "now"))
        c.execute("INSERT OR REPLACE INTO financial_config (key, value, updated_at) VALUES (?, ?, ?)",
                  ('labor_cost_per_hour', config.labor_cost, "now"))
        conn.commit()
        return {"status": "updated"}
    finally:
        conn.close()

@router.post("/tasks/dispatch")
def create_task(task: TaskCreate):
    conn = db.get_connection()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO tasks (task_type, target_palm_id, priority, status, created_at) VALUES (?, ?, ?, ?, ?)",
                  (task.task_type, task.target_palm_id, task.priority, 'Pending', "now"))
        conn.commit()
        
        # Notify
        notifications.send_telegram_alert(f"👷 New Task Dispatched: {task.task_type} for Palm #{task.target_palm_id}")
        
        return {"status": "created", "id": c.lastrowid}
    finally:
        conn.close()

# --- Existing Endpoints (Preserved) ---

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(months: int = 6):
    # Wrap in try-except to prevent 500 crash
    try:
        df = db.get_all_surveys_df()
        
        # Check data sufficiency
        if len(df) < 2:
            # Fallback: If only 1 scan exists, project a "Stable" trend (Flat Line)
            # This ensures charts are never empty for new users.
            latest = df.iloc[-1] if not df.empty else None
            base_health = float(latest['avg_health']) if latest is not None else 50.0
            
            future_dates = []
            last_date = pd.to_datetime(latest['scan_date']) if latest is not None else pd.Timestamp.now()
            
            for i in range(1, months + 1):
                next_d = last_date + pd.Timedelta(days=30 * i)
                future_dates.append(next_d.strftime("%Y-%m-%d"))
            
            # Yield calc for fallback
            current_count = df['total_palms'].iloc[-1] if not df.empty else 0
            yield_val = (current_count * (base_health / 100.0) * 80) / 1000.0
            
            return ForecastResponse(
                dates=future_dates,
                health_values=[base_health] * months,
                yield_values=[round(yield_val, 2)] * months,
                trend="Stable (Insufficient Data)",
                message="Projecting current status"
            )

        # Robust Date Parsing
        try:
            # Ensure string format and truncate time component (YYYY-MM-DD)
            df['scan_date'] = df['scan_date'].astype(str).str[:10]
            df['scan_date'] = pd.to_datetime(df['scan_date'], errors='coerce')
        except Exception as e:
            print(f"Date Parsing Warning: {e}")
            pass
            
        df = df.dropna(subset=['scan_date']).sort_values('scan_date')
        
        if df.empty:
             return ForecastResponse(dates=[], health_values=[], yield_values=[], trend="Date Error", message="Invalid Dates")

        df['ordinal'] = df['scan_date'].map(pd.Timestamp.toordinal)
        
        X = df[['ordinal']].values
        y = df['avg_health'].values
        
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
    except Exception as e:
        print(f"Forecast Error: {e}")
        return ForecastResponse(
            dates=[], health_values=[], yield_values=[],
            trend="Error",
            message=f"Forecasting Failed: {str(e)}"
        )

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
                pass 
            
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
