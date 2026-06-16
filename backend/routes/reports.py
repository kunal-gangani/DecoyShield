from fastapi import APIRouter
import os
from supabase import create_client

router = APIRouter()

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@router.get("/")
def get_reports():
    supabase = get_supabase()
    result = supabase.table("events").select("*").not_.is_("ai_summary", "null").order("created_at", desc=True).limit(20).execute()
    return result.data

@router.get("/stats")
def get_stats():
    supabase = get_supabase()
    events = supabase.table("events").select("risk_score, event_type, country").execute().data
    total = len(events)
    high_risk = len([e for e in events if e["risk_score"] >= 70])
    countries = list(set([e["country"] for e in events if e["country"]]))
    return {
        "total_events": total,
        "high_risk_events": high_risk,
        "unique_countries": countries,
    }