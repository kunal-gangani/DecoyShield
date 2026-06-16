from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class EventCreate(BaseModel):
    honeypot_id: Optional[str] = None
    honeypot_type: str
    ip: str
    event_type: str
    commands: Optional[List[str]] = []
    payload: Optional[str] = None
    raw_data: Optional[dict] = {}

class EventResponse(BaseModel):
    id: str
    honeypot_type: str
    ip: str
    country: Optional[str]
    city: Optional[str]
    isp: Optional[str]
    risk_score: int
    event_type: str
    commands: Optional[List[str]]
    payload: Optional[str]
    ai_summary: Optional[str]
    created_at: datetime