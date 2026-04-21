import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).parent.parent
DB_DIR = BASE_DIR / "data"
DB_PATH = DB_DIR / "diario.sqlite"

# App Info
APP_NAME = "Diario Personal Inteligente"
APP_VERSION = "3.0"

# NLP configuration
LANGUAGE = "es"

# UI Configuration
THEME_DEFAULT = "dark"
DASHBOARD_ENTRIES_LIMIT = 100
HISTORY_PAGE_STYLE = 20

# Emotion & Mood Configuration
# We will use Vader to generate continuous scores (-1 to 1)
MOOD_THRESHOLDS = {
    "Muy positivo": 0.6,
    "Positivo": 0.1,
    "Neutro": -0.1,
    "Negativo": -0.6,
    "Muy negativo": -1.0
}

MOOD_COLORS = {
    "Muy positivo": "#10B981", # Emerald
    "Positivo": "#34D399",     # Light Emerald
    "Neutro": "#FBBF24",       # Amber
    "Negativo": "#F87171",     # Light Red
    "Muy negativo": "#EF4444", # Red
}

MOOD_EMOJIS = {
    "Muy positivo": "🌟",
    "Positivo": "😊",
    "Neutro": "😐",
    "Negativo": "😔",
    "Muy negativo": "😢",
}
