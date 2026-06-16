async def generate_summary(event: dict) -> str:
    score = event.get("risk_score", 0)
    country = event.get("country", "Unknown")
    isp = event.get("isp", "Unknown")
    event_type = event.get("event_type", "unknown")
    honeypot = event.get("honeypot_type", "unknown")

    if score >= 90:
        risk_label = "CRITICAL"
    elif score >= 70:
        risk_label = "HIGH"
    elif score >= 40:
        risk_label = "MEDIUM"
    else:
        risk_label = "LOW"

    return (
        f"Source: {country}, {isp}\n"
        f"Behavior: {event_type} detected on {honeypot} honeypot\n"
        f"Risk: {risk_label} ({score}/100)\n"
        f"Action: Review attacker IP and monitor for further activity"
    )