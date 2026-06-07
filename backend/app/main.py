# ─────────────────────────────────────────────
# WiseKnit Backend — FastAPI App
# MType Workroom
# ─────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from .routes.ai import router as ai_router

load_dotenv()

app = FastAPI(
    title="WiseKnit API",
    description="Backend API for WiseKnit — AI-powered knitting companion",
    version="0.1.0",
)

# ── CORS ──────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:4173",
        "https://wiseknit.vercel.app",
        "https://wiseknit-git-main-stefanie-culley-s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────
app.include_router(ai_router)


@app.get("/")
async def root():
    return {"status": "ok", "app": "WiseKnit API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
