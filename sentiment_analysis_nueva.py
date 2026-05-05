from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from text_preprocessing import preprocess_text, SLANG_DICT
import re
import json
from typing import Dict, List, Tuple
import unicodedata

analyzer = SentimentIntensityAnalyzer()

# Load emotion keywords (subset from ai_api)
EMOTION_KEYWORDS = {
    'Enojo': ['enojado', 'ira', 'rabia', 'furia', 'molesto'],
    'Triste': ['triste', 'deprimido', 'depresion', 'llorar'],
    'Ansiedad': ['ansioso', 'estres', 'preocupado', 'panico'],
    'Feliz': ['feliz', 'alegre', 'contento', 'gozo'],
    'Excelente': ['excelente', 'increible', 'maravilloso', 'fantastico'],
    'Crisis': ['suicidio', 'suicida', 'matarme', 'quiero morir', 'no quiero vivir', 'no aguanto', 'no soporto', 'terminar todo', 'acabar con todo', 'desaparecer']
}

# Custom lexicon addition (subset)
CUSTOM_LEXICON = {
    'chido': 2.5, 'chingon': 3.0, 'aguitado': -2.5, 'chafa': -2.0,
    'suicidio': -4.5, 'suicida': -4.5, 'matarme': -4.5, 'matar': -4.0, 'quitarme': -4.5, 'morir': -4.5, 'desaparecer': -4.0, 'noquierovivir': -4.5
}
# Update lexicon
analyzer.lexicon.update(CUSTOM_LEXICON)

# Normalize and crisis patterns for intent detection
CRISIS_PATTERNS = [
    r"\bme voy a (quitarme|quitar la vida|matarme|matar)\b",
    r"\bvoy a (quitarme|matarme|suicidarme)\b",
    r"\b(quiero (morir|matarme|desaparecer|no vivir|no existir))\b",
    r"\b(pienso en (quitarme la vida|morir|suicidarme))\b",
    r"\b(terminar con mi vida|acabar con mi vida|acabar con todo)\b",
    r"\b(no quiero vivir|ya no quiero vivir|no quiero seguir)\b",
    r"\b(quitarme la vida|matarme|suicid)\b",
    r"\b(kill myself|end my life|i want to die|suicide)\b"
]

def _normalize_for_detection(s: str) -> str:
    s = s.lower()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9\s]", ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# Spanish lexicon from Kaggle datasets (estupido, feliz, etc.)
spanish_lexicon = {
    "estupido": -2.0,
    "enojado": -2.5,
    "mal": -1.8,
    "preocupado": -1.5,
    "triste": -2.2,
    "deprimido": -2.8,
    "estres": -2.0,
    "molesto": -1.8,
    "feliz": 2.5,
    "alegre": 2.3,
    "contento": 2.0,
    "excelente": 3.0,
    "increible": 2.8,
    "encanta": 2.2
}
analyzer.lexicon.update(spanish_lexicon)
print("Spanish lexicon loaded from Kaggle data!")

def detect_emotions(text_lower: str) -> List[str]:
    emotions = []
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                emotions.append(emotion)
                break
    return emotions if emotions else ['Neutral']

def has_crisis(text: str) -> bool:
    """Detects crisis intent using regex patterns on normalized text. Falls back to keyword scan."""
    if not text:
        return False
    norm = _normalize_for_detection(text)
    # Check patterns
    for pat in CRISIS_PATTERNS:
        if re.search(pat, norm):
            return True
    # Fallback: check simple keywords (also normalized)
    crisis_keywords = [ _normalize_for_detection(k) for k in EMOTION_KEYWORDS.get('Crisis', []) ]
    for kw in crisis_keywords:
        if kw in norm.replace(' ', '') or re.search(r'\b' + re.escape(kw) + r'\b', norm):
            return True
    return False

def analyze_sentiment(text: str) -> Dict:
    """
    Analyze sentiment using VADER on preprocessed text.
    Returns: compound, pos, neg, neu, emotions, crisis

    Improvements:
    - Do not translate by default to avoid external translation errors.
    - If crisis keywords detected, force an extreme negative score and flag requires_help.
    """
    # Avoid automatic translation during analysis (translation can distort crisis phrases)
    processed = preprocess_text(text, translate=False)
    text_lower = text.lower()
    emotions = detect_emotions(text_lower)
    crisis = has_crisis(text_lower)

    # If crisis detected, return a deterministic extreme-negative result to avoid misclassification
    if crisis:
        if 'Crisis' not in emotions:
            emotions = emotions + ['Crisis']
        return {
            'compound': -0.99,
            'pos': 0.0,
            'neg': 99.9,
            'neu': 0.1,
            'emotions': emotions,
            'requires_help': True,
            'preprocessed_text': processed[:200] + '...' if len(processed) > 200 else processed
        }

    scores = analyzer.polarity_scores(processed)
    return {
        'compound': round(scores['compound'], 3),
        'pos': round(scores['pos'] * 100, 1),
        'neg': round(scores['neg'] * 100, 1),
        'neu': round(scores['neu'] * 100, 1),
        'emotions': emotions,
        'requires_help': crisis,
        'preprocessed_text': processed[:200] + '...' if len(processed) > 200 else processed
    }

# Test
if __name__ == '__main__':
    test_texts = [
        'Hoy fue un día terrible, todo salió mal.',
        'Estoy chingón! Gané el examen 😎',
        'No aguanto más, quiero desaparecer. Estoy enojado y triste.'
    ]
    for text in test_texts:
        result = analyze_sentiment(text)
        print(f'Text: {text}')
        print(f'Result: {result}\\n')
