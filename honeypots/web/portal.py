from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
import httpx
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("DECOYSHIELD_API_URL", "http://127.0.0.1:8000")

logging.basicConfig(level=logging.INFO, format='%(asctime)s [WEB] %(message)s')
log = logging.getLogger(__name__)

app = FastAPI()


async def report_event(ip: str, event_type: str, payload: str = None, raw_data: dict = None):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"{API_URL}/events/", json={
                "honeypot_type": "web",
                "ip": ip,
                "event_type": event_type,
                "commands": [],
                "payload": payload,
                "raw_data": raw_data or {}
            })
    except Exception as e:
        log.error(f"Failed to report event: {e}")


LOGIN_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login - Production Server</title>
    <style>
        body { font-family: -apple-system, sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 320px; }
        h2 { margin: 0 0 24px; color: #1f2937; font-size: 20px; }
        input { width: 100%; padding: 10px; margin-bottom: 14px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
        button { width: 100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
        button:hover { background: #1d4ed8; }
        .err { color: #dc2626; font-size: 13px; margin-bottom: 14px; }
        .logo { text-align: center; margin-bottom: 20px; font-size: 24px; }
    </style>
</head>
<body>
    <div class="box">
        <div class="logo">🔒</div>
        <h2>Admin Portal Login</h2>
        {error}
        <form method="POST" action="/login">
            <input type="text" name="username" placeholder="Username" required autofocus>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Sign In</button>
        </form>
    </div>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
@app.get("/admin", response_class=HTMLResponse)
@app.get("/wp-admin", response_class=HTMLResponse)
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    ip = request.client.host
    log.info(f"Page visit from {ip} — {request.url.path}")
    await report_event(ip, "port_scan", raw_data={"path": str(request.url.path), "user_agent": request.headers.get("user-agent")})
    return LOGIN_PAGE.format(error="")


@app.post("/login", response_class=HTMLResponse)
async def login_attempt(request: Request, username: str = Form(...), password: str = Form(...)):
    ip = request.client.host
    log.info(f"Login attempt from {ip} — user: {username} pass: {password}")

    await report_event(
        ip,
        "credential_spray",
        payload=f"user={username} pass={password}",
        raw_data={
            "username": username,
            "password": password,
            "user_agent": request.headers.get("user-agent"),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    error_html = '<div class="err">Invalid username or password.</div>'
    return LOGIN_PAGE.format(error=error_html)


@app.get("/{path:path}")
async def catch_all(request: Request, path: str):
    ip = request.client.host
    log.info(f"Probe from {ip} — path: /{path}")
    await report_event(ip, "port_scan", raw_data={"path": f"/{path}", "user_agent": request.headers.get("user-agent")})
    return HTMLResponse("404 Not Found", status_code=404)


if __name__ == "__main__":
    import uvicorn
    log.info("Starting DecoyShield Web Honeypot on port 8081")
    log.info(f"Reporting to: {API_URL}")
    uvicorn.run(app, host="0.0.0.0", port=8081)