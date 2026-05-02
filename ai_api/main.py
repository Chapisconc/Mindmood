from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from fastapi.middleware.cors import CORSMiddleware
from deep_translator import GoogleTranslator
from functools import lru_cache
import re
import logging
import json
import emoji
from spellchecker import SpellChecker
from typing import List, Dict
 
# Configurar logging para crisis
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
 
app = FastAPI(title="Sentiment Analyzer API", version="2.0")
 
@app.get("/")
def read_root():
    return {
        "name": "MindMood AI Sentiment Engine",
        "status": "online",
        "message": "Welcome to the Intelligent Diary backend. The sentiment analysis engine is ready to receive requests.",
        "endpoints": {
            "analysis": "/analyze (POST)",
            "health": "/health (GET)",
            "docs": "/docs (Swagger UI)"
        }
    }

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
analyzer = SentimentIntensityAnalyzer()
 
# ============================================================================
# 🔧 LEXICÓN PERSONALIZADO MEJORADO
# ============================================================================
 
custom_lexicon = {
    # ✅ EXTREMOS POSITIVOS
    'marry': 3.5, 'wedding': 3.5, 'passed': 2.5, 'approve': 2.0, 
    'achieved': 3.0, 'proposal': 3.0, 'love': 3.5, 'amazing': 3.0,
    'fantastic': 3.0, 'excellent': 3.0, 'beautiful': 2.5, 'blessed': 3.0,
    'wonderful': 3.5, 'proud': 2.8, 'success': 3.0, 'healed': 3.0,
    'graduated': 3.5, 'promoted': 3.0, 'won': 2.8, 'kiss': 2.0,
    'grateful': 3.0, 'thankful': 2.8, 'joyful': 3.0, 'euphoric': 3.5,
    'thrilled': 3.2, 'delighted': 3.0, 'ecstatic': 3.5, 'celebration': 2.5,
    'triumph': 3.2, 'honored': 3.0, 'exhilarated': 3.5, 'relieved': 2.5,
    'fortunate': 2.8, 'privileged': 2.8, 'blessed': 3.2, 'inspired': 3.0,
    'motivated': 2.8, 'energized': 2.8, 'accomplished': 3.0, 'victorious': 3.2,
    
    # 🎉 ANUNCIOS Y EVENTOS DE VIDA
    'puppies': 2.5, 'puppy': 2.5, 'baby': 2.5, 'babies': 2.5,
    'grandfather': 2.0, 'grandmother': 2.0, 'grandpa': 2.0, 'grandma': 2.0,
    'dad': 1.5, 'mom': 1.5, 'father': 1.5, 'mother': 1.5,
    'born': 2.0, 'birth': 2.0, 'pregnant': 2.5, 'expecting': 2.0,
    
    # ❌ NEGATIVOS SEVEROS Y VIOLENCIA LABORAL / FÍSICA
    'punch': -3.5, 'hit': -3.0, 'strike': -3.0, 'slap': -3.0, 
    'throw': -2.0, 'threw': -2.5, 'yell': -2.5, 'yelled': -2.5,
    'scream': -2.5, 'insult': -3.0, 'insulted': -3.0, 'abuse': -3.5,
    'boss': -0.5, 'manager': -0.5, 'toxic': -3.0, 'hostile': -3.0,
    'sarcasm': -1.5, 'irony': -1.0, 'mock': -2.5, 'mocked': -2.5,
    'humiliated': -3.5, 'humiliate': -3.5, 'threaten': -3.5, 'threatened': -3.5,
    
    # ❌ NEGATIVOS EXTREMOS (Depresión)ojo)
    'angry': -2.8, 'furious': -3.5, 'rage': -3.5, 'frustrated': -2.5,
    'irritated': -2.0, 'annoyed': -1.8, 'resentful': -2.5, 'outraged': -3.0,
    'exasperated': -2.5, 'hostile': -2.8, 'bitter': -2.5, 'offended': -2.3,
    'insulted': -2.5, 'violated': -3.0, 'disrespected': -2.8, 'aggravated': -2.3,
    'provoked': -2.5, 'incensed': -3.2, 'livid': -3.5, 'seething': -3.0,
    
    # 💀 EXTREMOS NEGATIVOS (CRISIS/SALUD MENTAL) - PRIORIDAD MÁXIMA
    'depressed': -4.0, 'suicide': -4.5, 'suicidal': -4.5, 'kill': -4.0, 
    'die': -3.8, 'hopeless': -3.5, 'worthless': -3.5, 'anxious': -3.0, 
    'panic': -3.2, 'terrible': -3.0, 'hate': -3.2, 'worst': -3.0, 
    'pain': -3.0, 'hurt': -2.8, 'crying': -2.5, 'lonely': -2.8, 
    'abandoned': -3.0, 'disaster': -2.5, 'failure': -3.0, 'quit': -2.0, 
    'overwhelmed': -2.5, 'afraid': -2.5, 'terrified': -3.5, 'scared': -2.5, 
    'dread': -3.0, 'grief': -3.5, 'miserable': -3.5, 'suffering': -3.0, 
    'agony': -3.5, 'despair': -4.0, 'helpless': -3.5, 'trapped': -3.2,
    'broken': -3.0, 'shattered': -3.2, 'destroyed': -3.5, 'ruined': -3.0,
    'damned': -3.5, 'cursed': -3.2, 'doomed': -3.5, 'forsaken': -3.5,
    'self-harm': -4.5, 'cut': -4.0, 'bleed': -3.8, 'numb': -2.8,
    'empty': -2.8, 'void': -3.0, 'meaningless': -3.5, 'pointless': -3.2,
    'useless': -3.5, 'burden': -3.0, 'pathetic': -3.2, 'disgusting': -3.0,
    
    # 🇲🇽 JERGA MEXICANA POSITIVA
    'chido': 2.5, 'chingon': 3.5, 'chingón': 3.5, 'rifa': 2.0, 
    'perron': 3.0, 'perrón': 3.0, 'padre': 2.0, 'vergas': 3.0,
    'verga': 3.0, 'chingoneria': 3.0, 'fregon': 2.5, 'fregón': 2.5,
    'neta': 2.0, 'de pelos': 2.5, 'a toda madre': 3.0, 'poca madre': 3.0,
    'me late': 2.5, 'a huevo': 2.5, 'órale': 2.0, 'zaz': 2.0,
    'no manches': 2.0, 'no mames': 1.8, 'buena onda': 2.5, 'onda positiva': 2.5,
    'salvado': 2.5, 'salvada': 2.5, 'qué alivio': 2.5, 'menos mal': 2.0,
    'divino': 3.0, 'genial': 2.8, 'espectacular': 3.0, 'sensacional': 3.0,
    
    # 🇲🇽 JERGA MEXICANA NEGATIVA
    'aguitado': -2.5, 'agüitado': -2.5, 'chingado': -3.0, 'chingada': -3.5,
    'madres': -2.0, 'cabron': -2.5, 'cabrón': -2.5, 'hueva': -1.5,
    'jodido': -3.0, 'madreado': -2.5, 'pedorro': -2.0, 'weva': -1.5,
    'chafa': -2.0, 'culero': -3.5, 'verguiza': -3.0, 'putazo': -2.5,
    'me saca de onda': -3.0, 'me saca de pedo': -3.0, 'me vale': -1.5,
    'me vale madre': -2.0, 'hasta la madre': -3.0, 'qué oso': -2.5,
    'que oso': -2.5, 'chale': -2.0, 'nomás': -1.0, 'ni modo': -1.0,
    'está cañón': -2.0, 'está canón': -2.0, 'me cae gordo': -2.5,
    'dar asco': -3.0, 'está gacho': -2.5, 'gacho': -2.5, 'naco': -1.5,
    'toxic': -2.5, 'me tira': -2.0, 'me pone furico': -3.0, 'encachimbado': -2.5,
    'emputecido': -3.0, 'rebotado': -2.5, 'cargado': -2.0,
}
 
analyzer.lexicon.update(custom_lexicon)
 
# ============================================================================
# 📚 PALABRAS CLAVE EMOCIONALES EXPANDIDAS
# ============================================================================
 
EMOTION_KEYWORDS = {
    'Enojo': [
        'enojado', 'enojada', 'enojo', 'molesto', 'molestia',
        'ira', 'rabia', 'furia', 'furioso', 'enfurecido',
        'frustrado', 'frustración', 'encabronado',
        'harto', 'irritado', 'irritación',
        'indignado', 'indignación', 'cólera',
        'exasperado', 'resentido', 'resentimiento',
        'hostil', 'hostilidad', 'malhumor',
        'ofendido', 'ultrajado', 'agraviado', 'grosero',
        'aventó', 'aventar', 'puñetazo', 'golpear', 'golpe',
        'pegar', 'grito', 'gritar', 'insulto', 'insultar',
        'humillado', 'humillación', 'burla', 'burlarse',
        'ganas de matar', 'ganas de golpear', 'coraje',
        'odio', 'odiar', 'detesto', 'detestar', 'aborrezco',
        'aborrecer', 'asqueado', 'asqueada', 'repulsión',
    ],
    'Ansiedad': [
        'ansioso', 'ansiosa', 'ansiedad', 'estresado', 'estresada', 'estrés',
        'preocupado', 'preocupada', 'preocupación', 'nervios', 'nervioso', 'nerviosa',
        'panico', 'pánico', 'inquieto', 'inquieta', 'inquietud',
        'angustia', 'angustiado', 'angustiada', 'desasosiego', 'obsesionado',
        'agobio', 'agobiado', 'agobiada', 'tensión', 'tenso', 'tensa',
        'zozobra', 'aprensión', 'intranquilo', 'intranquila', 'perturbado',
        'incertidumbre', 'abrumado', 'abrumada', 'acelerado', 'acelerada',
        'desvelo', 'palpitaciones', 'sofocante', 'ahogado', 'oprimido',
        'inseguro', 'insegura', 'fijación', 'obsesión', 'ataque de pánico',
        'sin dormir', 'insomnio', 'alterado', 'alterada', 'neurótico',
    ],
    'Miedo': [
        'miedo', 'terror', 'asustado', 'asustada', 'pavor', 'temor',
        'temeroso', 'temerosa', 'espanto', 'espantado', 'espantada',
        'fobia', 'alarma', 'alarmado', 'alarmada', 'aprensión',
        'recelo', 'receloso', 'susto', 'aterrado', 'aterrada',
        'aterrorizado', 'aterrorizada', 'pánico', 'horrorizado', 'horrorizada',
        'petrificado', 'petrificada', 'paralizado', 'paralizada', 'pavoroso',
        'desprotegido', 'desprotegida', 'indefenso', 'indefensa', 'vulnerable',
        'desvalido', 'desvalida', 'en peligro', 'amenazado', 'amenazada',
        'claustrofobia', 'agorafobia', 'fobia social', 'medroso', 'miedoso',
    ],
    'Triste': [
        'triste', 'tristeza', 'sad', 'deprimido', 'deprimida', 'depresión',
        'desconsolado', 'desconsolada', 'desolado', 'desolada', 'melancólico', 'melancólica',
        'pesimista', 'pesimismo', 'abatido', 'abatida', 'decaído', 'decaída',
        'desmoralizado', 'desmoralizada', 'apesadumbrado', 'apesadumbrada',
        'bajo de ánimo', 'sin ganas', 'vacío', 'vacía', 'desmoralizador',
        'abandonado', 'abandonada', 'rechazado', 'rechazada', 'fracasado',
        'desengañado', 'desengañada', 'decepcionante', 'decepción', 'desilusionado',
        'frustración silenciosa', 'pesadumbre', 'aflicción', 'angustia emocional',
        'quebranto', 'congoja', 'dolor emocional', 'luto', 'duelo',
        'desdicha', 'infelicidad', 'lástima', 'pena', 'sentimiento de pérdida',
        'desesperado', 'desesperada', 'desesperación', 'engaño', 'engañó', 'engañada',
        'engañado', 'traición', 'traicionó', 'infidelidad', 'infiel', 'mentira', 'mintió',
    ],
    'Agradecido': [
        'gracias', 'gratitud', 'agradecer', 'agradezco', 'agradecido', 'agradecida',
        'agradecidos', 'agradecidas', 'benedición', 'bendecido', 'bendecida',
        'afortunado', 'afortunada', 'privilegiado', 'privilegiada', 'dichoso', 'dichosa',
        'reconocido', 'reconocida', 'valorado', 'valorada', 'aprecio',
        'profundamente agradecido', 'de corazón', 'eternamente agradecido',
        'bendito', 'venerado', 'estimado', 'estimada', 'honrado',
        'alivio', 'menos mal', 'salvado', 'salvada', 'qué alivio',
        'reconocimiento', 'veneración', 'reverencia', 'devoción',
    ],
    'Sorpresa': [
        'sorpresa', 'sorprendido', 'sorprendida', 'asombro', 'asombrado', 'asombrada',
        'increible', 'increíble', 'impactado', 'impactada', 'impacto',
        'atónito', 'atónita', 'estupefacto', 'estupefacta', 'desconcertado',
        'revelación', 'revelador', 'casual', 'imprevisto', 'inesperado', 'inesperada',
        'no lo puedo creer', 'no me lo esperaba', 'inesperado', 'casual',
        'quedé en blanco', 'órale', 'zas', 'vaya', 'caramba',
        'confundido', 'confundida', 'perplejo', 'perpleja', 'desconcertante',
    ],
    'Crisis': [  # 💀 NUEVO: Categoría de crisis/suicidio
        'suicida', 'suicidio', 'matarme', 'acabar con esto', 'no aguanto', 'no puedo más',
        'no hay salida', 'estoy jodido', 'estoy jodida', 'completamente perdido',
        'completamente perdida', 'inútil', 'inutilidad', 'despedida', 'adiós',
        'ya no quiero vivir', 'no quiero existir', 'mejor muerto', 'mejor muerta',
        'me corto', 'me quiero hacer daño', 'autolesión', 'masoquismo',
        'me quiero morir', 'quiero morir', 'prefiero estar muerto', 'prefiero estar muerta',
        'no tengo valor', 'me odio', 'odio mi vida', 'detesto existir',
        'insoportable', 'insoportablemente', 'no resisto más', 'me ahoga todo',
        'quiero desaparecer', 'quiero dejar de existir', 'maldigo mi existencia',
        'quisiera no haber nacido', 'me arrepiento de vivir', 'maldición',
    ],
    'Feliz': [
        'feliz', 'felicidad', 'alegre', 'alegría', 'contento', 'contenta',
        'disfrutando', 'disfruto', 'placer', 'gozo', 'gozoso', 'gozosa',
        'sonriente', 'optimista', 'entusiasmado', 'entusiasmada', 'entusiasmo',
        'animado', 'animada', 'buen humor', 'de buenas', 'chido', 'chingón',
    ],
    'Excelente': [
        'excelente', 'increíble', 'maravilloso', 'maravillosa', 'fantástico', 'fantástica',
        'estupendo', 'estupenda', 'genial', 'perfecto', 'perfecta', 'éxito',
        'triunfo', 'victoria', 'eufórico', 'eufórica', 'radiante', 'espectacular',
        'sublime', 'insuperable', 'lo mejor', 'brillante', 'magnífico', 'magnífica',
    ]
}
 
# ============================================================================
# 🎭 REFUERZO EMOCIONAL (Emojis y Gritos)
# ============================================================================
 
POSITIVE_EMOJIS = {'😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🥳', '😏', '😌', '🤤', '🤠', '🥳', '😎', '✨', '🔥', '🚀', '⭐', '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'}
NEGATIVE_EMOJIS = {'☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '🤬', '😡', '😠', '🙄', '🤨', '😒', '💬', '💔', '🥀', '💀', '☠️', '🏚️', '🌧️', '⛈️', '🌪️', '🌫️', '🥀'}

def analyze_emotional_reinforcement(text: str) -> dict:
    """Detectar intensidad por mayúsculas y emojis"""
    intensity_boost = 1.0
    emoji_sentiment = 0.0
    
    # 1. Gritos (Mayúsculas)
    # Si más del 30% de las palabras largas están en mayúsculas, es un grito
    words = text.split()
    caps_words = [w for w in words if w.isupper() and len(w) > 2]
    if len(caps_words) > 0 and len(caps_words) >= len(words) * 0.3:
        intensity_boost = 1.2  # +20% de intensidad
        
    # 2. Emojis
    for char in text:
        if char in POSITIVE_EMOJIS:
            emoji_sentiment += 0.05
        elif char in NEGATIVE_EMOJIS:
            emoji_sentiment -= 0.05
            
    return {
        "multiplier": intensity_boost,
        "emoji_score": max(min(emoji_sentiment, 0.2), -0.2) # Tope de 0.2
    }

# ============================================================================
# 🔤 NORMALIZACIÓN DE JERGA MEXICANA Y CORRECTOR ORTOGRÁFICO
# ============================================================================
 
import os

# Inicializar corrector ortográfico en español
spell = SpellChecker(language='es')

def load_mexican_slang():
    """Cargar dataset de jerga desde JSON para optimizar memoria"""
    try:
        base_dir = os.path.dirname(__file__)
        dataset_path = os.path.join(base_dir, "mexican_slang_dataset.json")
        with open(dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error cargando mexican_slang_dataset.json: {e}")
        return {}

MEXICAN_SLANG = load_mexican_slang()
 
# Compilar regex para mejorar velocidad (añadiendo bordes de palabra \b)
compiled_slang = {re.compile(r'\b' + pattern + r'\b'): replacement for pattern, replacement in MEXICAN_SLANG.items()}
 
# ============================================================================
# 🧠 INTENSIFICADORES Y NEGACIONES
# ============================================================================
 
INTENSIFICADORES = {
    'super': 1.4, 'muy': 1.3, 'extremadamente': 1.5, 'completamente': 1.35,
    'totalmente': 1.35, 'absolutamente': 1.4, 'realmente': 1.25, 'verdaderamente': 1.25,
    'sumamente': 1.4, 'excesivamente': 1.35, 'increíblemente': 1.3,
    'demasiado': 1.3, 'bien': 1.15, 'mucho': 1.2, 'bastante': 1.2,
}
 
NEGACIONES = {'no', 'ni', 'nunca', 'jamás', 'nada', 'nadie', 'tampoco', 'sin'}
 
# ============================================================================
# 🔄 TRADUCCIÓN CON CACHÉ
# ============================================================================
 
# Reutilizar el traductor para mayor velocidad
translator = GoogleTranslator(source='es', target='en')

@lru_cache(maxsize=1000)
def translate_cached(text: str) -> str:
    """Traducir con caché LRU para evitar llamadas repetidas"""
    if not text.strip(): return ""
    try:
        return translator.translate(text)
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text
 
# ============================================================================
# 🛠️ FUNCIONES DE ANÁLISIS MEJORADAS
# ============================================================================
 
def detect_negation(text: str) -> bool:
    """Detectar si hay negación en el texto (simple pero efectivo)"""
    words = text.lower().split()
    for i, word in enumerate(words):
        if word in NEGACIONES:
            # Negación afecta palabra(s) siguiente(s)
            return True
    return False
 
def get_intensifier_multiplier(text: str) -> float:
    """Calcular multiplicador de intensidad basado en palabras"""
    words = text.lower().split()
    multiplier = 1.0
    for word in words:
        if word in INTENSIFICADORES:
            multiplier *= INTENSIFICADORES[word]
    return min(multiplier, 1.5)  # Máximo 50% más intenso
 
def normalize_mexican_slang(text: str) -> str:
    """Normalizar jerga mexicana usando regex compiladas"""
    for pattern, replacement in compiled_slang.items():
        text = pattern.sub(replacement, text)
    return text
 
def has_crisis_indicators(text: str) -> bool:
    """Detectar indicadores de crisis"""
    text_lower = text.lower()
    crisis_keywords = EMOTION_KEYWORDS.get('Crisis', [])
    
    # Buscar palabras clave de crisis
    for keyword in crisis_keywords:
        if keyword in text_lower:
            return True
    
    # Patrones adicionales de crisis con bordes de palabra estrictos
    crisis_patterns = [
        r'\bno\s+aguanto\s+más\b',
        r'\bno\s+puedo\s+más\b',
        r'\b(quiero|prefiero)\s+(morir|morirme)\b',
        r'\bme\s+(quiero\s+)?matar\b',
        r'\bsería\s+mejor\s+no\s+existir\b',
        r'\bno\s+hay\s+salida\b',
        r'\binsoportable\b',
    ]
    
    for pattern in crisis_patterns:
        if re.search(pattern, text_lower):
            return True
    
    return False
 
# ============================================================================
# 📊 PYDANTIC MODELS
# ============================================================================
 
class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=2000, 
                      description="Texto a analizar (3-2000 caracteres)")
    language: str = Field(default="es", description="Idioma del texto")
    
    @validator('text')
    def text_not_empty(cls, v):
        if not v.strip():
            raise ValueError('El texto no puede estar vacío')
        return v.strip()
 
class AnalysisResponse(BaseModel):
    mood: str
    all_moods: List[str]
    emotions_distribution: Dict[str, float]
    score: float
    confidence: float
    summary: str
    requires_help: bool
    crisis_level: str
 
# ============================================================================
# 🎯 GENERACIÓN DE RESUMEN MEJORADA
# ============================================================================
 
def generate_human_summary(moods, compound_score, requires_help=False):
    """Generar resumen empático, profundo y con recomendaciones psicológicas ricas"""
    
    if requires_help:
        return (
            "Noto que estás pasando por un momento abrumador y crítico. "
            "Es completamente válido sentir que no puedes más, pero tu bienestar es vital. "
            "Por favor, considera hablar con un profesional, la carga compartida es más ligera. "
            "Existen líneas de apoyo gratuitas y confidenciales. ¡No estás solo/a en esta oscuridad! 💙"
        )
 
    if not moods:
        return "Tu entrada parece muy neutral. A veces la calma y la ausencia de picos emocionales es el mejor momento para reflexionar sobre lo que realmente valoramos en el día a día."
    
    # 1. Mensaje de empatía basado en el mood principal
    primary = moods[0]
    
    # Base de datos de sugerencias ricas y profundas por emoción
    insights = {
        'Excelente': [
            "Es un momento cumbre. Aprovecha esta energía expansiva para iniciar nuevos proyectos o contagiar a las personas que te rodean.",
            "Estos son los días que recargan el alma. Intenta guardar este sentimiento en tu memoria para cuando necesites recordar lo bien que se siente estar vivo."
        ],
        'Feliz': [
            "La alegría es el combustible del bienestar. ¿Qué fue exactamente lo que desencadenó esto? Cultivar más de eso es el secreto de la felicidad a largo plazo.",
            "Una energía muy positiva. Permítete disfrutarlo sin culpas ni prisas; la felicidad genuina a veces dura solo instantes, pero su impacto es duradero."
        ],
        'Agradecido': [
            "La gratitud es la emoción más poderosa para reconfigurar el cerebro. Reconocer lo bueno, incluso en las cosas pequeñas, eleva tu resiliencia ante cualquier adversidad.",
            "Sentir agradecimiento te ancla en el presente. Has logrado ver el valor real de tu entorno hoy, un excelente ejercicio de atención plena."
        ],
        'Sorpresa': [
            "Lo inesperado te sacó de la rutina. Ya sea para bien o para mal, la sorpresa nos recuerda que no tenemos el control de todo, y aprender a fluir con la incertidumbre es una gran virtud.",
            "Una sacudida en tu día. A veces, las cosas que no planeamos terminan siendo los capítulos más interesantes de nuestra historia."
        ],
        'Neutral': [
            "Hay una quietud en tus palabras. La neutralidad no es apatía; es un lienzo en blanco. Usa esta tranquilidad para observar tus pensamientos sin juzgarlos.",
            "Un momento de equilibrio. No todo tiene que ser un pico de euforia o un valle de tristeza. El centro también es un buen lugar para estar."
        ],
        'Triste': [
            "La tristeza es pesada, pero tiene un propósito: te pide hacer una pausa y procesar. No intentes reprimirla; permítete sentir, llorar si es necesario, y recuerda que la nube eventualmente pasará.",
            "Se percibe una melancolía profunda. Ser compasivo contigo mismo/a hoy es tu única prioridad. Haz algo pequeño que te reconforte, como tomar un té caliente o escuchar tu canción favorita."
        ],
        'Enojo': [
            "Percibo mucha frustración y fuego en tus palabras. El enojo es una emoción de límite: te está indicando que algo es injusto o inaceptable para ti. Usa esta energía para establecer límites sanos, no para destruir. Inhala profundamente antes de reaccionar.",
            "Escribir sobre esta ira es el primer paso para desactivarla. Es totalmente válido sentir coraje, especialmente en situaciones de hostilidad. Intenta alejarte físicamente del estímulo antes de tomar una decisión permanente."
        ],
        'Ansiedad': [
            "Tu mente parece estar corriendo en el futuro. La ansiedad se alimenta de la incertidumbre. Intenta regresar al presente: nombra 5 cosas que puedas ver, 4 que puedas tocar y concéntrate en tu respiración. Estás a salvo aquí y ahora.",
            "La presión y el estrés están saturando tu sistema. Rompe la tarea gigante en pedacitos microscópicos. No tienes que resolver el resto de tu vida hoy, solo concéntrate en la siguiente hora."
        ],
        'Miedo': [
            "El miedo paraliza, pero también intenta protegerte. Reconocer a qué le temes le quita poder. Da un paso atrás y pregúntate si la amenaza es real en este instante o si es una proyección de tu mente.",
            "Sentir vulnerabilidad asusta. Pero la valentía no es la ausencia de miedo, es avanzar a pesar de él. Toma medidas que te devuelvan el sentido de seguridad hoy."
        ]
    }

    import random
    insight = random.choice(insights.get(primary, insights['Neutral']))
    
    # 2. Construir la narrativa
    if compound_score <= -0.5:
        intro = "Siento que hoy la carga es realmente pesada y la situación es difícil."
    elif compound_score <= -0.1:
        intro = "Percibo obstáculos emocionales en tu día de hoy."
    elif compound_score >= 0.5:
        intro = "¡Qué energía tan radiante transmiten tus palabras!"
    elif compound_score >= 0.1:
        intro = "Se nota un aire ligero y positivo en lo que describes."
    else:
        intro = "Gracias por abrirte con honestidad."

    # Combinación de emociones
    if len(moods) > 1:
        if primary in ['Enojo', 'Ansiedad'] and 'Triste' in moods:
            blend = f" Es completamente natural que detrás de ese {primary.lower()} se esconda también tristeza."
        elif primary in ['Feliz', 'Excelente'] and 'Agradecido' in moods:
            blend = " La alegría combinada con gratitud es la receta perfecta para un día memorable."
        else:
            blend = f" Además de {primary.lower()}, noto matices de {moods[1].lower()} en tu relato."
    else:
        blend = ""

    return f"{intro}{blend}\n\n💡 Reflexión: {insight}"

 
# ============================================================================
# 🚀 ENDPOINT PRINCIPAL MEJORADO
# ============================================================================
 
@app.post("/analyze", response_model=AnalysisResponse)
def analyze(data: AnalyzeRequest):
    """
    Analizar el sentimiento del texto en español con jerga mexicana
    
    - **text**: Texto a analizar (3-2000 caracteres)
    - **language**: Idioma (default: 'es' para español)
    
    Retorna: mood, resumen empático, score, y si requiere ayuda profesional
    """
    
    # NUEVO: Eliminar todos los emojis del texto para que sea texto plano puro
    original_text = emoji.replace_emoji(data.text, replace='')
    text_lower = original_text.lower()
    
    # Paso 1: Normalizar jerga mexicana
    normalized_text = normalize_mexican_slang(original_text)
    
    # Paso 2: Traducir (con caché)
    try:
        translated_text = translate_cached(normalized_text)
    except Exception as e:
        logger.warning(f"Translation failed, using original: {e}")
        translated_text = normalized_text
    
    # Paso 3: Análisis de sentimiento
    score = analyzer.polarity_scores(translated_text)
    compound = score["compound"]
    
    # --- MEJORA: Aplicar Intensificadores, Negaciones y Refuerzo (Caps/Emojis) ---
    reinforcement = analyze_emotional_reinforcement(original_text)
    multiplier = get_intensifier_multiplier(original_text) * reinforcement["multiplier"]
    
    compound *= multiplier
    compound += reinforcement["emoji_score"]
    
    # VADER ya maneja negaciones en el texto traducido, no invertimos manualmente
    # ---------------------------------------------------
    compound = max(min(compound, 1.0), -1.0)
    # ---------------------------------------------------
    requires_help = False
    crisis_level = "normal"
    
    if has_crisis_indicators(text_lower):
        requires_help = True
        crisis_level = "critical"
        logger.warning(f"CRISIS DETECTED: {original_text[:100]}...")
    
    # Paso 5: Detectar emociones por palabras clave
    detected_moods = []
    
    # Buscar keywords de emociones con bordes de palabra estrictos para evitar falsos positivos (ej: feliz vs infeliz)
    for mood_name, keywords in EMOTION_KEYWORDS.items():
        for word in keywords:
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                detected_moods.append(mood_name)
                break # Evitar duplicados de la misma categoría
    
    # Paso 6: Análisis basado en score
    if compound >= 0.8:
        detected_moods.append("Excelente")
    elif compound >= 0.1:
        detected_moods.append("Feliz")
    elif compound <= -0.9:  # Umbral estricto para crisis genérica
        if not any(m in ["Enojo", "Tristeza", "Ansiedad", "Miedo"] for m in detected_moods):
            detected_moods.append("Crisis")
            requires_help = True
            crisis_level = "critical"
    elif compound <= -0.1:
        detected_moods.append("Triste")
    
    # Paso 7: Determinar distribución de emociones
    distribution = {}
    if not detected_moods:
        distribution = {"Neutral": 100.0}
    else:
        # Contar ocurrencias para dar peso (basado en cuántas palabras de cada tipo hay)
        total_found = len(detected_moods)
        for m in set(detected_moods):
            count = detected_moods.count(m)
            distribution[m] = round((count / total_found) * 100, 1)

    # Paso 8: Determinar mood primario (Priorizando emociones específicas)
    if not detected_moods:
        primary_mood = "Neutral"
        crisis_level = "normal"
    else:
        # Prioridad basada en severidad
        # Solo marcamos Crisis si fue detectada por indicadores reales o score extremo
        if requires_help or "Crisis" in detected_moods:
            primary_mood = "Crisis"
            crisis_level = "critical"
        elif "Enojo" in detected_moods: 
            primary_mood = "Enojo"
            # Si el enojo fue lo que bajó el score pero NO hay palabras de crisis reales, quitamos la alerta
            if not has_crisis_indicators(text_lower) and "Crisis" not in detected_moods:
                requires_help = False
                crisis_level = "normal"
        elif "Ansiedad" in detected_moods: 
            primary_mood = "Ansiedad"
        elif "Miedo" in detected_moods: 
            primary_mood = "Miedo"
        elif "Agradecido" in detected_moods: 
            primary_mood = "Agradecido"
        elif "Sorpresa" in detected_moods: 
            primary_mood = "Sorpresa"
        elif "Triste" in detected_moods: 
            primary_mood = "Triste"
        elif "Feliz" in detected_moods: 
            primary_mood = "Feliz"
        elif compound >= 0.8: 
            primary_mood = "Excelente"
        else: 
            primary_mood = detected_moods[0] if detected_moods else "Neutral"
 
    # Paso 9: Calcular confianza
    has_keywords = len(detected_moods) > 0
    score_confidence = min(abs(compound), 1.0)
    confidence = (score_confidence + (0.5 if has_keywords else 0.0)) / 1.5
    
    # Penalizar confianza si hay contradicciones (Sarcasmo probable)
    if (compound > 0.2 and reinforcement["emoji_score"] < -0.05) or \
       (compound < -0.2 and reinforcement["emoji_score"] > 0.05):
        confidence -= 0.2
        
    confidence = max(min(round(confidence, 2), 1.0), 0.1)
    
    # Paso 10: Generar resumen
    human_summary = generate_human_summary(detected_moods, compound, requires_help)
    
    # Limpiar moods duplicados
    detected_moods = list(set(detected_moods))
    
    return AnalysisResponse(
        mood=primary_mood,
        all_moods=detected_moods if detected_moods else ["Neutral"],
        emotions_distribution=distribution,
        summary=human_summary,
        score=round(compound, 3),
        requires_help=requires_help,
        confidence=confidence,
        crisis_level=crisis_level
    )
 
# ============================================================================
# 📊 ENDPOINT ADICIONAL PARA ESTADÍSTICAS (Opcional)
# ============================================================================
 
@app.get("/health")
def health_check():
    """Health check del API"""
    return {
        "status": "healthy",
        "version": "2.0",
        "features": ["sentiment_analysis", "crisis_detection", "mexican_slang", "translation_cache"]
    }
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
