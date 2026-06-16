import httpx

async def get_geo(ip: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://ip-api.com/json/{ip}")
            data = response.json()
            if data.get("status") == "success":
                return {
                    "country": data.get("country"),
                    "city": data.get("city"),
                    "isp": data.get("isp"),
                }
    except Exception:
        pass
    return {"country": None, "city": None, "isp": None}