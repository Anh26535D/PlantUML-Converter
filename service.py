from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from pathlib import Path

app = FastAPI()

# Enable CORS for the Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).parent
MODEL_PATH = PROJECT_ROOT / "visualizer" / "src" / "assets" / "model.json"
LAYOUT_PATH = PROJECT_ROOT / "visualizer" / "src" / "assets" / "layout.json"

class LayoutData(BaseModel):
    positions: dict

@app.get("/api/model")
async def get_model():
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=404, detail="Model file not found. Run the converter first.")
    with open(MODEL_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/layout")
async def get_layout():
    if not LAYOUT_PATH.exists():
        return {"positions": {}}
    with open(LAYOUT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/layout")
async def save_layout(data: LayoutData):
    with open(LAYOUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data.dict(), f, indent=2)
    return {"message": "Layout saved successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
