from fastapi import APIRouter
from models.event import EventCreate
from services.geo import get_geo
from services.scoring import calculate_score
from services.alerts import send_discord_alert
from services.ai_summary import generate_summary
import os
from supabase import create_client

router = APIRouter()

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@router.post("/")
async def create_event(event: EventCreate):
    supabase = get_supabase()

    geo = await get_geo(event.ip)
    score = calculate_score(event.event_type, event.commands)

    data = {
        "honeypot_id": event.honeypot_id,
        "honeypot_type": event.honeypot_type,
        "ip": event.ip,
        "country": geo["country"],
        "city": geo["city"],
        "isp": geo["isp"],
        "risk_score": score,
        "event_type": event.event_type,
        "commands": event.commands,
        "payload": event.payload,
        "raw_data": event.raw_data,
    }

    result = supabase.table("events").insert(data).execute()
    saved_event = result.data[0]

    summary = await generate_summary(saved_event)
    supabase.table("events").update({"ai_summary": summary}).eq("id", saved_event["id"]).execute()
    saved_event["ai_summary"] = summary

    if score >= 70:
        await send_discord_alert(saved_event)

    return {"status": "ok", "event": saved_event}

@router.get("/")
def get_events():
    supabase = get_supabase()
    result = supabase.table("events").select("*").order("created_at", desc=True).limit(50).execute()
    return result.data