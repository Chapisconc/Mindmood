from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from text_preprocessing import preprocess_text, SLANG_DICT
import re
import json
from typing import Dict, List, Tuple

analyzer = SentimentIntensityAnalyzer()

# Load emotion keywords (subset from ai_api)
EMOTION_KEYWORDS = {
    'Enojo': ['enojado', 'ira', 'rabia', 'furia', 'molesto'],
    'Triste': ['triste', 'deprimido', 'depresion', 'llorar'],
    'Ansiedad': ['ansioso', 'estres', 'preocupado', 'panico'],
    'Feliz': ['feliz', 'alegre', 'contento', 'gozo'],
    'Excelente': ['excelente', 'increible', 'maravilloso', 'fantastico'],
'Crisis': [
  'suicidio', 'suicida', 'matarme', 'matar me', 'quiero morir', 'no quiero vivir', 'no aguanto mas', 'no soporto', 'terminar todo', 'acabar con todo', 
  'kill myself', 'suicide', 'end my life', 'no more', 'death', 'despair', 'hopeless', 'overwhelmed', 'trapped', 'agony', 'die', 'kill me'
  ]
}

# Custom lexicon addition (subset)
CUSTOM_LEXICON = {
    # Mexican slang sentiments
    'chido': 2.5, 'chingon': 3.0, 'aguitado': -2.5, 'chafa': -2.0,
    # Crisis super negative
    'suicidio': -4.5, 'suicida': -4.5, 'matarme': -4.5, 'matar me': -4.5, 'quiero morir': -4.5, 'no quiero vivir': -4.5, 'no aguanto mas': -4.0, 'terminar todo': -4.0, 'kill myself': -4.5, 'end it all': -4.5
}
analyzer.lexicon.update(CUSTOM_LEXICON)

def detect_emotions(text_lower: str) -> List[str]:
    emotions = []
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                emotions.append(emotion)
                break
    return emotions if emotions else ['Neutral']

def has_crisis(text_lower: str) -> bool:
    crisis_keywords = EMOTION_KEYWORDS['Crisis']
    for kw in crisis_keywords:
        if kw in text_lower:
            return True
    return False

def analyze_sentiment(text: str) -> Dict:
    """
    Analyze sentiment using VADER on preprocessed text.
    Returns: compound, pos, neg, neu, emotions, crisis
    """
    processed = preprocess_text(text)
    scores = analyzer.polarity_scores(processed)
    
    text_lower = text.lower()
    emotions = detect_emotions(text_lower)
    crisis = has_crisis(text_lower)
    
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
    analyzer = SentimentIntensityAnalyzer()
    test_texts = [
        'Hoy fue un día terrible, todo salió mal.',
        'Estoy chingón! Gané el examen 😎',
        'No aguanto más, quiero desaparecer.'
    ]
    for text in test_texts:
        result = analyze_sentiment(text)
        print(f'Text: {text}')
        print(f'Result: {result}\\n')

