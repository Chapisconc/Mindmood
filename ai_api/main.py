from fastapi import FastAPI
from pydantic import BaseModel
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from fastapi.middleware.cors import CORSMiddleware
from deep_translator import GoogleTranslator

app = FastAPI()

# Enable CORS for the mobile app to reach the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = SentimentIntensityAnalyzer()

# Mejorar el diccionario básico de VADER inyectando pesos emocionales masivos (Supercharged Lexicon)
custom_lexicon = {
    # Extremos Positivos
    'marry': 3.5, 'wedding': 3.5, 'passed': 2.5, 'approve': 2.0, 
    'achieved': 3.0, 'proposal': 3.0, 'love': 3.5, 'amazing': 3.0,
    'fantastic': 3.0, 'excellent': 3.0, 'beautiful': 2.5, 'blessed': 3.0,
    'wonderful': 3.5, 'proud': 2.8, 'success': 3.0, 'healed': 3.0,
    'graduated': 3.5, 'promoted': 3.0, 'won': 2.8, 'kiss': 2.0,
    
    # Extremos Negativos / Crisis (Salud Mental)
    'depressed': -4.0, 'suicide': -4.0, 'kill': -4.0, 'die': -3.8,
    'hopeless': -3.5, 'worthless': -3.5, 'anxious': -3.0, 'panic': -3.2,
    'terrible': -3.0, 'hate': -3.2, 'worst': -3.0, 'pain': -3.0,
    'hurt': -2.8, 'crying': -2.5, 'lonely': -2.8, 'abandoned': -3.0,
    'disaster': -2.5, 'failure': -3.0, 'quit': -2.0, 'overwhelmed': -2.5,
    
    # Jerga Mexicana (Modismos Regionales)
    'chido': 2.5, 'chingon': 3.5, 'chingón': 3.5, 'rifa': 2.0, 
    'perron': 3.0, 'perrón': 3.0, 'padre': 2.0, 'vergas': 3.0,
    'verga': 3.0, 'chingoneria': 3.0, 'fregon': 2.5, 'fregón': 2.5,
    'aguitado': -2.5, 'agüitado': -2.5, 'chingado': -3.0, 'chingada': -3.5,
    'madres': -2.0, 'cabron': -2.5, 'cabrón': -2.5, 'hueva': -1.5,
    'jodido': -3.0, 'madreado': -2.5, 'pedorro': -2.0, 'weva': -1.5,
    'chafa': -2.0, 'culero': -3.5, 'verguiza': -3.0, 'putazo': -2.5
}
analyzer.lexicon.update(custom_lexicon)

translator = GoogleTranslator(source='es', target='en')

import re

MEXICAN_SLANG = {
    r'\bchido\b': 'excelente',
    r'\bchingon\b': 'maravilloso',
    r'\bchingón\b': 'maravilloso',
    r'\brifa\b': 'es el mejor',
    r'\bperron\b': 'fantástico',
    r'\bperrón\b': 'fantástico',
    r'\bpadre\b': 'muy alegre',
    r'\baguitado\b': 'deprimido',
    r'\bagüitado\b': 'muy triste',
    r'\bchingado\b': 'arruinado',
    r'\bchingada\b': 'destruido',
    r'\bmadres\b': 'terrible',
    r'\bcabron\b': 'muy brutal',
    r'\bcabrón\b': 'muy brutal',
    r'\bhueva\b': 'aburrido',
    r'\bjodido\b': 'pésimo',
    r'\bmadreado\b': 'destrozado',
    r'\bchafa\b': 'decepcionante',
    r'\bculero\b': 'horrible',
    r'\bwey\b': 'amigo',
    r'\bguey\b': 'amigo',
    r'\bno mames\b': 'es increíble',
    r'\bal chile\b': 'sinceramente',
    r'\bpoca madre\b': 'excelente',
    r'\besta cañon\b': 'está difícil',
    r'\bestá cañón\b': 'está difícil',
    r'\bni modo\b': 'no hay de otra',
    r'\bque oso\b': 'qué vergüenza',
    r'\bqué oso\b': 'qué vergüenza',
    r'\bme cae gordo\b': 'me desagrada',
    r'\ben las nubes\b': 'distraído',
    r'\bestar crudo\b': 'sentirse mal',
    r'\bdar asco\b': 'ser repugnante',
    r'\bque choro\b': 'qué mentira',
    r'\bqué choro\b': 'qué mentira',
    r'\bde pelos\b': 'genial',
    r'\ba toda madre\b': 'fantástico',
    r'\bno hay pex\b': 'no hay problema',
    r'\bestar de la patada\b': 'estar muy mal',
    r'\bhacer el paro\b': 'hacer un favor',
    r'\bmande\b': 'dígame',
    r'\bchamba\b': 'trabajo',
    r'\bchambear\b': 'trabajar',
    r'\bchela\b': 'cerveza',
    r'\bcheve\b': 'cerveza',
    r'\bchale\b': 'qué mal',
    r'\bneto\b': 'de verdad',
    r'\bneta\b': 'de verdad',
    r'\bgacho\b': 'feo',
    r'\bjale\b': 'trabajo',
    r'\bmonis\b': 'dinero',
    r'\blana\b': 'dinero',
    r'\bvaro\b': 'dinero',
    r'\bpasta\b': 'dinero',
    r'\bfresa\b': 'presumido',
    r'\bnaco\b': 'ordinario',
    r'\bmorras\b': 'chicas',
    r'\bmorros\b': 'chicos',
    r'\bcompas\b': 'amigos',
    r'\bcarnal\b': 'hermano',
    r'\bestar pasado de lanza\b': 'haber exagerado'
}

def normalize_mexican_slang(text: str) -> str:
    text_lower = text.lower()
    for slang, standard in MEXICAN_SLANG.items():
        text_lower = re.sub(slang, standard, text_lower)
    return text_lower

class AnalyzeRequest(BaseModel):
    text: str

@app.post("/analyze")
def analyze(data: AnalyzeRequest):
    original_text = data.text
    
    normalized_text = normalize_mexican_slang(original_text)
    
    # Translate normalized Spanish to English
    try:
        translated_text = translator.translate(normalized_text)
    except Exception:
        translated_text = normalized_text # Fallback
        
    score = analyzer.polarity_scores(translated_text)
    
    compound = score["compound"]
    requires_help = False
    
    if compound >= 0.5:
        mood = "Excelente"
    elif compound >= 0.05:
        mood = "Feliz"
    elif compound <= -0.5:
        mood = "Crisis"
        requires_help = True
    elif compound <= -0.05:
        mood = "Triste"
    else:
        mood = "Neutral"
        
    return {
        "mood": mood,
        "score": compound,
        "details": score,
        "requires_help": requires_help
    }
