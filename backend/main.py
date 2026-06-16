from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import events, honeypots, reports

load_dotenv()

app = FastAPI(
    title="DecoyShield API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(honeypots.router, prefix="/honeypots", tags=["Honeypots"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/")
def root():
    return {"status": "DecoyShield API is running"}