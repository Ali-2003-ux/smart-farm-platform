
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from datetime import datetime
from core.db import get_latest_palms_df
import pandas as pd

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
except ImportError:
    colors = None

router = APIRouter()

class ReportRequest(BaseModel):
    report_name: str
    inspector_name: str = "SmartFarm AI Auto-Inspector"

@router.post("/pdf/generate")
def generate_compliance_report(request: ReportRequest):
    """
    Generates a formal PDF Compliance Report for Global G.A.P certification.
    Includes: Farm stats, Health Summary, and List of Critical Issues.
    """
    if colors is None:
        raise HTTPException(status_code=500, detail="ReportLab library not installed. Please install 'reportlab'.")

    try:
        df = get_latest_palms_df()
        if df.empty:
            raise HTTPException(status_code=404, detail="No data available for report.")

        # Prepare Data
        total_palms = len(df)
        healthy_count = len(df[df['health_score'] >= 75])
        critical_count = len(df[df['health_score'] < 50])
        avg_health = df['health_score'].mean()
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        filename = f"Audit_Report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        filepath = os.path.join("generated_reports", filename)
        os.makedirs("generated_reports", exist_ok=True)

        # PDF Generation
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        elements.append(Paragraph("Smart Farm - Phytosanitary Compliance Report", styles['Title']))
        elements.append(Spacer(1, 12))
        
        # Meta Info
        elements.append(Paragraph(f"<b>Date:</b> {timestamp}", styles['Normal']))
        elements.append(Paragraph(f"<b>Inspector:</b> {request.inspector_name}", styles['Normal']))
        elements.append(Paragraph(f"<b>Location:</b> Sector A (GPS Referenced)", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Summary Table
        elements.append(Paragraph("<b>Executive Summary</b>", styles['Heading2']))
        data = [
            ["Metric", "Value"],
            ["Total Palms", str(total_palms)],
            ["Healthy Palms (Grade A/B)", str(healthy_count)],
            ["Critical Palms (Require Action)", str(critical_count)],
            ["Average Vitality Index", f"{avg_health:.2f}%"]
        ]
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))

        # Critical Issues List
        if critical_count > 0:
            elements.append(Paragraph("<b>Critical Issues Log (Action Required)</b>", styles['Heading2']))
            critical_palms = df[df['health_score'] < 50]
            
            issue_data = [["Palm ID", "Location (X, Y)", "Health Score", "Status"]]
            for _, row in critical_palms.iterrows():
                issue_data.append([
                    str(row['id']),
                    f"({row['x']:.1f}, {row['y']:.1f})",
                    f"{row['health_score']}%",
                    "Red Weevil Risk"
                ])
            
            t2 = Table(issue_data)
            t2.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkred),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(t2)
        else:
             elements.append(Paragraph("No critical phytosanitary issues detected.", styles['Normal']))

        # Certification Footer
        elements.append(Spacer(1, 24))
        elements.append(Paragraph("<i>This document certifies that the scanned sector has been analyzed using AI-driven spectral imaging. Data is retained for 5 years per Global G.A.P regulations.</i>", styles['Italic']))

        doc.build(elements)

        return {
            "status": "success",
            "filename": filename,
            "url": f"/static/reports/{filename}",
            "summary": f"Report generated for {total_palms} palms."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
