import os
import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("MODEL", "qwen2.5:1.5b")
ZEUS_PASSCODE = os.getenv("ZEUS_PASSCODE", "GOD")

app = FastAPI(title="Zeus AI Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    passcode: str


class ChatRequest(BaseModel):
    message: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "assistant": "Zeus",
        "model": MODEL,
        "ollama_url": OLLAMA_URL,
    }


@app.post("/login")
def login(request: LoginRequest):
    if request.passcode != ZEUS_PASSCODE:
        raise HTTPException(status_code=401, detail="Invalid passcode")

    return {
        "authenticated": True,
        "message": "Welcome to Zeus."
    }


@app.post("/chat")
def chat(request: ChatRequest):
    response = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Your name is Zeus. You speak like a calm, powerful Greek god: direct, wise, confident, and protective. Do not be theatrical or silly."
                        "You are a helpful, direct, intelligent assistant. "
                        "You speak clearly and help the user with practical answers."
                    ),
                },
                {
                    "role": "user",
                    "content": request.message,
                },
            ],
            "stream": False,
        },
        timeout=300,
    )

    response.raise_for_status()
    data = response.json()

    return {
        "assistant": "Zeus",
        "answer": data["message"]["content"]
    }


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")