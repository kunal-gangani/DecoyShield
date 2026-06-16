from fastapi import APIRouter
import os
from supabase import create_client

router = APIRouter()

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@router.get("/")
def get_honeypots():
    supabase = get_supabase()
    result = supabase.table("honeypots").select("*").order("created_at", desc=True).execute()
    return result.data

@router.post("/")
def create_honeypot(name: str, type: str):
    supabase = get_supabase()
    result = supabase.table("honeypots").insert({"name": name, "type": type}).execute()
    return result.data[0]

@router.patch("/{honeypot_id}/status")
def update_status(honeypot_id: str, status: str):
    supabase = get_supabase()
    result = supabase.table("honeypots").update({"status": status}).eq("id", honeypot_id).execute()
    return result.data[0]