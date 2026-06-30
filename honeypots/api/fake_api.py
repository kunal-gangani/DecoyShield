from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("DECOYSHIELD_API_URL", "http://127.0.0.1:8000")

logging.basicConfig(level=logging.INFO, format='%(asctime)s [API] %(message)s')
log = logging.getLogger(__name__)

app = FastAPI()


async def report_event(ip: str, event_type: str, payload: str = None, raw_data: dict = None):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"{API_URL}/events/", json={
                "honeypot_type": "api",
                "ip": ip,
                "event_type": event_type,
                "commands": [],
                "payload": payload,
                "raw_data": raw_data or {}
            })
    except Exception as e:
        log.error(f"Failed to report event: {e}")


FAKE_USERS = [
    {"id": 1, "name": "Admin User", "email": "admin@company.com", "role": "admin"},
    {"id": 2, "name": "John Smith", "email": "john@company.com", "role": "user"},
]

FAKE_KEYS = {
    "aws_access_key": "AKIAFAKE1234567890XX",
    "aws_secret": "fAkeS3cr3tKeyD0N0tUseThis1234567890",
    "stripe_key": "sk_live_REDACTED_HONEYPOT_BAIT_NOT_REAL",
}


@app.get("/api/users")
async def get_users(request: Request):
    ip = request.client.host
    log.info(f"API enumeration from {ip} — /api/users")
    await report_event(ip, "credential_spray", raw_data={"endpoint": "/api/users", "method": "GET"})
    return JSONResponse(FAKE_USERS)


@app.get("/api/config")
async def get_config(request: Request):
    ip = request.client.host
    log.info(f"Config probe from {ip} — /api/config — HIGH RISK")
    await report_event(ip, "payload_upload", raw_data={"endpoint": "/api/config", "method": "GET", "exposed": "credentials"})
    return JSONResponse(FAKE_KEYS)


@app.get("/api/admin/users/{user_id}")
async def get_user(user_id: int, request: Request):
    ip = request.client.host
    log.info(f"User enum from {ip} — /api/admin/users/{user_id}")
    await report_event(ip, "credential_spray", raw_data={"endpoint": f"/api/admin/users/{user_id}", "method": "GET"})
    return JSONResponse({"error": "Not authorized"}, status_code=403)


@app.post("/api/auth/login")
async def fake_login(request: Request):
    ip = request.client.host
    body = await request.json()
    log.info(f"API login attempt from {ip} — {body}")
    await report_event(
        ip,
        "credential_spray",
        payload=str(body),
        raw_data={"endpoint": "/api/auth/login", "body": body, "timestamp": datetime.utcnow().isoformat()}
    )
    return JSONResponse({"error": "Invalid credentials"}, status_code=401)


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(request: Request, path: str):
    ip = request.client.host
    log.info(f"Unknown endpoint probe from {ip} — /{path} — {request.method}")
    await report_event(ip, "port_scan", raw_data={"path": f"/{path}", "method": request.method})
    return JSONResponse({"error": "Not Found"}, status_code=404)


if __name__ == "__main__":
    import uvicorn
    log.info("Starting DecoyShield API Honeypot on port 8082")
    log.info(f"Reporting to: {API_URL}")
    uvicorn.run(app, host="0.0.0.0", port=8082)