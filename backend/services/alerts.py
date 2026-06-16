import httpx
import os

async def send_discord_alert(event: dict):
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return

    score = event.get("risk_score", 0)

    if score >= 90:
        color = 0xFF0000
        level = "🔴 CRITICAL"
    elif score >= 70:
        color = 0xFF6600
        level = "🟠 HIGH"
    elif score >= 40:
        color = 0xFFFF00
        level = "🟡 MEDIUM"
    else:
        color = 0x00FF00
        level = "🟢 LOW"

    embed = {
        "embeds": [
            {
                "title": f"{level} — {event.get('honeypot_type', '').upper()} Honeypot Hit",
                "color": color,
                "fields": [
                    {"name": "IP", "value": event.get("ip", "Unknown"), "inline": True},
                    {"name": "Country", "value": event.get("country", "Unknown"), "inline": True},
                    {"name": "Risk Score", "value": str(score), "inline": True},
                    {"name": "Event Type", "value": event.get("event_type", "Unknown"), "inline": True},
                    {"name": "ISP", "value": event.get("isp", "Unknown"), "inline": True},
                    {"name": "AI Summary", "value": event.get("ai_summary", "Generating..."), "inline": False},
                ],
                "footer": {"text": "DecoyShield — Fake targets. Real protection."}
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json=embed)
    except Exception as e:
        print(f"Discord alert failed: {str(e)}")