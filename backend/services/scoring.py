SCORE_MAP = {
    "port_scan": 20,
    "login_attempt": 40,
    "credential_spray": 70,
    "command_execution": 90,
    "payload_upload": 95,
    "lateral_movement": 98,
}

def calculate_score(event_type: str, commands: list = []) -> int:
    base = SCORE_MAP.get(event_type, 30)
    if commands and len(commands) > 3:
        base = min(base + 10, 100)
    return base