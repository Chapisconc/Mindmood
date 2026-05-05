from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentiment_analysis_nueva import analyze_sentiment
import uvicorn

app = FastAPI(title="MindMood AI Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str

def classify_mood(compound: float, emotions: list) -> str:
    """
    Classify mood based on compound score and detected emotions.
    Uses granular classification for richer user experience.
    """
    if any(e in emotions for e in ['Crisis']):
        return 'Crisis'
    if compound >= 0.6 or 'Excelente' in emotions:
        return 'Excelente'
    if compound >= 0.2 or 'Feliz' in emotions:
        return 'Feliz'
    if compound >= 0.05:
        return 'Neutral'
    if compound > -0.2:
        if 'Enojo' in emotions:
            return 'Enojo'
        if 'Ansiedad' in emotions:
            return 'Ansiedad'
        return 'Neutral'
    if compound > -0.5:
        if 'Triste' in emotions:
            return 'Triste'
        if 'Enojo' in emotions:
            return 'Enojo'
        if 'Ansiedad' in emotions:
            return 'Ansiedad'
        return 'Neutral'
    return 'Triste'

@app.post("/analyze")
async def analyze_endpoint(input: TextInput):
    try:
        analysis = analyze_sentiment(input.text)
        emotions = analysis.get('emotions', ['Neutral'])
        compound = analysis.get('compound', 0)
        mood = classify_mood(compound, emotions)
        return {
            "mood": mood,
            "score": compound,
            "requires_help": analysis.get('requires_help', False),
            "summary": "Analysis complete",
            "emotions_distribution": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "MindMood AI"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
