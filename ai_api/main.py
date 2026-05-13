from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from functools import lru_cache
import re
import logging
import json
import emoji
import time
import os
from collections import defaultdict
from spellchecker import SpellChecker
from typing import List, Dict, Tuple
import math
 
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

# ============================================================================
# 🌐 CORS RESTRINGIDO (solo orígenes conocidos)
# ============================================================================
ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "").split(",") if os.environ.get("CORS_ORIGINS") else [
    "http://127.0.0.1:8000",
    "http://localhost:5173",
    "http://localhost:4173",
    "https://mindmood.vercel.app",
    "https://mindmood-web.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "ngrok-skip-browser-warning"],
)

# ============================================================================
# 🔒 RATE LIMITING POR MEMORIA
# ============================================================================
RATE_LIMIT_WINDOW = 60  # segundos
RATE_LIMIT_MAX = 10      # requests por ventana
_rate_store = defaultdict(list)

async def rate_limiter(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW

    _rate_store[client_ip] = [t for t in _rate_store[client_ip] if t > window_start]

    if len(_rate_store[client_ip]) >= RATE_LIMIT_MAX:
        return JSONResponse(
            status_code=429,
            content={
                "error": "Demasiadas solicitudes. Intenta de nuevo en un minuto.",
                "requires_help": False,
                "mood": "Neutral",
                "score": 0,
                "summary": "Límite de solicitudes alcanzado. Por favor espera antes de enviar otro análisis.",
                "crisis_level": "normal",
                "confidence": 0,
            },
        )

    _rate_store[client_ip].append(now)
    response = await call_next(request)
    return response

app.middleware("http")(rate_limiter)
 
logger.info("Cargando modelo robertuito-sentiment-analysis. Esto puede tomar unos segundos...")
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="pysentimiento/robertuito-sentiment-analysis",
    tokenizer="pysentimiento/robertuito-sentiment-analysis",
    device=-1
)
logger.info("Cargando modelo robertuito-emotion-analysis para análisis detallado...")
emotion_pipeline = pipeline(
    "text-classification",
    model="pysentimiento/robertuito-emotion-analysis",
    tokenizer="pysentimiento/robertuito-emotion-analysis",
    return_all_scores=True,
    device=-1
)
logger.info("Modelos cargados exitosamente.")
 
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
        'aborrecer', 'caga', 'cagar', 'me caga', 'pinche', 'chingada', 'encabronado', 'encabronada',
    ],
    'Asco': [
        'asco', 'asqueado', 'asqueada', 'asqueroso', 'asquerosa', 'repulsión', 'repugnante', 'guácala', 'fuchi',
        'nauseas', 'náuseas', 'vomitivo', 'desagradable', 'fuchi', 'puaj', 'repulsion', 'guacala',
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
        'cansado', 'cansada', 'agotado', 'agotada', 'pesado', 'pesada', 'harto', 'harta',
        'duele', 'dolor', 'soledad', 'solo', 'sola', 'extraño', 'extrañar',
    ],
    'Agradecido': [
        'gracias', 'agradecido', 'agradecida', 'gratitud', 'bendecido', 'bendecida',
        'reconozco', 'valorar', 'valoro', 'afortunadamente', 'agradecidos', 'agradecidas', 'benedición',
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
        'completamente perdida', 'inútil', 'inutilidad', 'despedida', 'adiós', 'despido',
        'ya no quiero vivir', 'no quiero existir', 'mejor muerto', 'mejor muerta',
        'me corto', 'me quiero hacer daño', 'autolesión', 'masoquismo', 'cortarme',
        'me quiero morir', 'quiero morir', 'prefiero estar muerto', 'prefiero estar muerta',
        'no tengo valor', 'me odio', 'odio mi vida', 'detesto existir', 'me cansé de todo',
        'insoportable', 'insoportablemente', 'no resisto más', 'me ahoga todo',
        'quiero desaparecer', 'quiero dejar de existir', 'maldigo mi existencia',
        'quisiera no haber nacido', 'me arrepiento de vivir', 'maldición', 'vete a la mierda todo',
        'me voy de este mundo', 'me voy para siempre', 'los voy a extrañar', 'perdón por todo',
        'último mensaje', 'mi última voluntad', 'ya no estaré', 'para cuando leas esto',
    ],
    'Feliz': [
        'feliz', 'felicidad', 'alegre', 'alegría', 'contento', 'contenta',
        'disfrutando', 'disfruto', 'placer', 'gozo', 'gozoso', 'gozosa',
        'sonriente', 'optimista', 'entusiasmado', 'entusiasmada', 'entusiasmo',
        'animado', 'animada', 'buen humor', 'de buenas', 'chido', 'chingón',
        'esperanza', 'optimista', 'positivo', 'bueno', 'buena', 'mejor',
        'amo', 'amar', 'adoro', 'adorar', 'me encanta', 'encanta', 'te quiero', 'quiero mucho',
    ],
    'Excelente': [
        'excelente', 'increíble', 'maravilloso', 'maravillosa', 'fantástico', 'fantástica',
        'estupendo', 'estupenda', 'genial', 'perfecto', 'perfecta', 'éxito',
        'triunfo', 'victoria', 'eufórico', 'eufórica', 'radiante', 'espectacular',
        'sublime', 'insuperable', 'lo mejor', 'brillante', 'magnífico', 'magnífica',
    ]
}

# Normalizar acentos en las palabras clave para búsqueda rápida
import unicodedata
def _quick_remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', str(input_str))
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

EMOTION_KEYWORDS = {
    cat: [ _quick_remove_accents(kw.lower()) for kw in kws ] 
    for cat, kws in EMOTION_KEYWORDS.items()
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
    """Detectar indicadores de crisis con normalización y tolerancia a errores (Spellcheck)"""
    import unicodedata
    def remove_accents(input_str):
        nfkd_form = unicodedata.normalize('NFKD', input_str.lower())
        return "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    
    text_lower = text.lower()
    text_no_accents = remove_accents(text_lower)
    crisis_keywords = EMOTION_KEYWORDS.get('Crisis', [])
    
    # 1. Búsqueda directa (Rápida)
    for keyword in crisis_keywords:
        if keyword in text_no_accents:
            return True
            
    # 2. Tolerancia a errores ortográficos (Solo si no se detectó nada aún)
    # Analizamos palabra por palabra para detectar typos en palabras críticas
    words = text_no_accents.split()
    critical_stems = ['matar', 'suicidio', 'suicida', 'morir', 'morirme', 'matarme', 'adios', 'despedida']
    
    for word in words:
        if len(word) < 4: continue # Evitar falsos positivos en palabras cortas
        # Si la palabra es muy parecida a un stem crítico (ej. "maatr" -> "matar")
        if word in critical_stems:
            return True
        
        # Uso del corrector para palabras sospechosas
        try:
            # Opción A: Corrector ortográfico estándar
            corrected = spell.correction(word)
            if corrected and remove_accents(corrected) in critical_stems:
                return True
            
            # Opción B: Similitud de caracteres (Fuzzy matching)
            # Si la palabra tiene un error de una letra (maatr -> matar)
            from difflib import SequenceMatcher
            for stem in critical_stems:
                if SequenceMatcher(None, word, stem).ratio() > 0.8:
                    return True
        except:
            pass
    
    # 3. Patrones adicionales de crisis (Regex)
    crisis_patterns = [
        r'\bno\s+aguanto\s+más\b',
        r'\bno\s+puedo\s+más\b',
        r'\b(quiero|prefiero)\s+(morir|morirme)\b',
        r'\bme\s+(quiero\s+)?matar\b',
        r'\bsería\s+mejor\s+no\s+existir\b',
        r'\bno\s+hay\s+salida\b',
        r'\binsoportable\b',
        r'\bme\s+despido\b',
        r'\bme\s+voy\s+para\s+siempre\b',
        r'\badiós\s+a\s+todos\b',
        r'\bya\s+no\s+estaré\b',
        r'\bmi\s+último\s+mensaje\b',
        r'\bme\s+canse\s+de\s+vivir\b',
        r'\bmatarme\b',
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
    selected_moods: List[str] = Field(default=[],
                      description="Emociones que el usuario seleccionó manualmente")
    
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
    selected_moods: List[str]
 
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

    import secrets
    insight = secrets.choice(insights.get(primary, insights['Neutral']))
    
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
# 🔬 FUSIÓN MEJORADA: ENTROPÍA + VOTO SUAVIZADO + CONCILIACIÓN
# ============================================================================

APP_EMOTIONS = ["Excelente", "Feliz", "Agradecido", "Sorpresa", "Neutral",
                "Enojo", "Ansiedad", "Miedo", "Triste", "Asco", "Crisis"]
K = len(APP_EMOTIONS)

def fusion_emocion_mejorada(
    p_model: Dict[str, float],
    selected_moods: List[str],
    r: float = 0.7,
    alpha_min: float = 0.1,
    alpha_max: float = 0.8,
    gamma: float = 2.0,
    delta_conflicto: float = 0.15,
    boost_conflicto: float = 0.15,
) -> Tuple[Dict[str, float], float]:
    """
    Fusiona la distribución del modelo con las emociones seleccionadas por el usuario
    usando entropía, voto suavizado y conciliación de conflictos.
    
    Args:
        p_model: distribución del modelo en % (dict {emoción: valor})
        selected_moods: emociones seleccionadas por el usuario
        r: fiabilidad base del usuario (0.7 = el usuario acierta el 70% de las veces)
        alpha_min: peso mínimo del usuario cuando el modelo está muy seguro
        alpha_max: peso máximo del usuario cuando el modelo no sabe nada
        gamma: controla la rapidez de la transición (mayor = más pegado al modelo)
        delta_conflicto: diferencia máxima top1-top2 para considerar "empate"
        boost_conflicto: cuánto reforzar alpha si el usuario desempata
        
    Returns:
        (p_final_en_porcentajes, alpha_usado)
    """
    total = sum(p_model.values())
    if total == 0:
        return {e: round(100.0 / K, 1) for e in APP_EMOTIONS}, 0.0
    
    prob_model = {k: v / total for k, v in p_model.items()}
    for e in APP_EMOTIONS:
        prob_model.setdefault(e, 0.0)
    
    # 1. Entropía normalizada de la distribución del modelo
    entropia = -sum(p * math.log2(p) for p in prob_model.values() if p > 0)
    H_norm = min(max(entropia / math.log2(K), 0.0), 1.0)
    
    # 2. Alpha dinámico: curva continua basada en incertidumbre
    alpha = alpha_max - (alpha_max - alpha_min) * (1.0 - H_norm) ** gamma
    alpha = min(max(alpha, alpha_min), alpha_max)
    
    # 3. Voto suavizado del usuario (soft voting)
    n_selected = len(selected_moods) if selected_moods else 0
    q_user = {}
    
    if n_selected > 0:
        r_per_selected = r / n_selected
        remainder_per_other = (1.0 - r) / (K - n_selected) if K > n_selected else 0.0
        for e in APP_EMOTIONS:
            q_user[e] = r_per_selected if e in selected_moods else remainder_per_other
    else:
        for e in APP_EMOTIONS:
            q_user[e] = 1.0 / K
    
    # 4. Fusión: p_final = (1-α)·p_model + α·q_user
    p_final = {}
    for e in APP_EMOTIONS:
        p_final[e] = (1.0 - alpha) * prob_model[e] + alpha * q_user[e]
    
    # 5. Conciliación: si el usuario eligió la 2ª opción del modelo en un "empate"
    if n_selected > 0:
        sorted_emotions = sorted(prob_model, key=prob_model.get, reverse=True)
        e_top1 = sorted_emotions[0]
        prob_top1 = prob_model[e_top1]
        e_top2 = sorted_emotions[1] if K > 1 else None
        prob_top2 = prob_model[e_top2] if e_top2 else 0.0
        
        if (e_top2 and prob_top1 != 0 and
            any(s == e_top2 for s in selected_moods) and
            (prob_top1 - prob_top2) < delta_conflicto):
            alpha = min(alpha + boost_conflicto, 0.95)
            for e in APP_EMOTIONS:
                p_final[e] = (1.0 - alpha) * prob_model[e] + alpha * q_user[e]
    
    # Normalizar a porcentajes
    total_final = sum(p_final.values())
    if total_final > 0:
        p_final_pct = {k: round((v / total_final) * 100.0, 1) for k, v in p_final.items()}
    else:
        p_final_pct = {k: round(100.0 / K, 1) for k in APP_EMOTIONS}
    
    return p_final_pct, round(alpha, 3)

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
    
    # NUEVO: Normalizar acentos para búsqueda de palabras clave
    import unicodedata
    def remove_accents(input_str):
        nfkd_form = unicodedata.normalize('NFKD', input_str)
        return "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    
    text_no_accents = remove_accents(text_lower)
    
    # Paso 1: Normalizar jerga mexicana
    normalized_text = normalize_mexican_slang(original_text)
    
    # Paso 2: Análisis de sentimiento nativo con modelo de HuggingFace
    try:
        # truncamos a 1500 caracteres por precaución, aunque el modelo debería manejar bien.
        hf_result = sentiment_pipeline(normalized_text[:1500])[0]
        label = hf_result['label']  # 'POS', 'NEG', 'NEU'
        hf_score = hf_result['score'] # 0 a 1
        
        if label == 'POS':
            base_compound = hf_score * 0.9 
        elif label == 'NEG':
            base_compound = -hf_score * 0.9
        else: # NEU
            base_compound = 0.0
    except Exception as e:
        logger.error(f"Error en HuggingFace pipeline: {e}")
        base_compound = 0.0
    
    # --- MEJORA: Aplicar Intensificadores y Refuerzo (Caps/Emojis) ---
    reinforcement = analyze_emotional_reinforcement(original_text)
    multiplier = get_intensifier_multiplier(original_text) * reinforcement["multiplier"]
    
    compound = base_compound * multiplier
    compound += reinforcement["emoji_score"]
    
    # ---------------------------------------------------
    compound = max(min(compound, 1.0), -1.0)
    # ---------------------------------------------------
    requires_help = False
    crisis_level = "normal"
    
    if has_crisis_indicators(text_lower):
        requires_help = True
        crisis_level = "critical"
        compound = -0.95 # Fuerza un score muy bajo para crisis
        masked = original_text[:50] + "..." if len(original_text) > 50 else original_text[:20]
        logger.warning(f"CRISIS DETECTED (masked): [redacted]")
    
    # Paso 5: Análisis avanzado de Emociones (HuggingFace)
    emotion_map = {
        'joy': 'Feliz',
        'sadness': 'Triste',
        'anger': 'Enojo',
        'surprise': 'Sorpresa',
        'disgust': 'Asco',
        'fear': 'Miedo',
        'others': 'Neutral'
    }
    
    distribution = {}
    detected_moods = []
    
    try:
        # Extraer todas las puntuaciones
        emotion_results = emotion_pipeline(normalized_text[:1500])[0]
        
        # Mapear a porcentajes
        for item in emotion_results:
            es_label = emotion_map.get(item['label'], 'Neutral')
            percentage = round(item['score'] * 100, 1)
            
            # Sumar si ya existe (ej. others -> Neutral, si mapeáramos otra cosa a Neutral)
            if es_label in distribution:
                distribution[es_label] += percentage
            else:
                distribution[es_label] = percentage
                
            # Agregar a detected_moods si es significativo (> 35%)
            if percentage > 35.0 and es_label != 'Neutral':
                detected_moods.append(es_label)
                
    except Exception as e:
        logger.error(f"Error en HuggingFace emotion pipeline: {e}")
        distribution = {"Indeterminado": 100.0}
        
    # Limpiar posibles errores de redondeo en distribución
    distribution = {k: round(v, 1) for k, v in distribution.items() if v > 0.5} # Filtramos los muy bajos
    
    # Filtro de polaridad: eliminar emociones que contradicen el tono general
    # Se aplica PRIMERO para limpiar el ruido del modelo antes del refuerzo por keywords
    if compound > 0.3:
        negative_emotions = ["Triste", "Enojo", "Miedo", "Asco", "Ansiedad"]
        cleaned_dist = {k: v for k, v in distribution.items() if k not in negative_emotions or v > 25.0}
        if cleaned_dist:
            distribution = cleaned_dist
            detected_moods = [m for m in detected_moods if m not in negative_emotions or distribution.get(m, 0) > 25.0]
    elif compound < -0.3:
        positive_emotions = ["Feliz", "Excelente", "Agradecido", "Sorpresa"]
        cleaned_dist = {k: v for k, v in distribution.items() if k not in positive_emotions or v > 25.0}
        if cleaned_dist:
            distribution = cleaned_dist
            detected_moods = [m for m in detected_moods if m not in positive_emotions or distribution.get(m, 0) > 25.0]
    
    # Re-normalizar la distribución para que sume 100%
    total_dist = sum(distribution.values())
    if total_dist > 0:
        distribution = {k: round((v / total_dist) * 100, 1) for k, v in distribution.items()}
    
    # Refuerzo por Palabras Clave: usar regex con word boundaries \b para evitar falsos positivos
    for category, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            try:
                word_pattern = re.compile(r'\b' + re.escape(kw) + r'\b', re.IGNORECASE)
                if word_pattern.search(text_no_accents):
                    if category not in detected_moods:
                        detected_moods.append(category)
                    distribution[category] = max(distribution.get(category, 0), 30.0)
                    break
            except re.error:
                pass
    
    # Añadir Crisis si los indicadores de alerta saltaron
    if requires_help:
        if "Crisis" not in detected_moods:
            detected_moods.append("Crisis")
        distribution = {"Crisis": 100.0} # Prioridad máxima
    # Añadir Excelente si el score es súper positivo
    elif compound >= 0.8 and "Feliz" in detected_moods:
        detected_moods.append("Excelente")
        distribution["Excelente"] = distribution.pop("Feliz", 0) # Promovemos Feliz a Excelente

    # Paso 6: Fusión mejorada con entropía, voto suavizado y conciliación
    if data.selected_moods and len(data.selected_moods) > 0:
        distribution, alpha_usado = fusion_emocion_mejorada(
            p_model=distribution,
            selected_moods=data.selected_moods,
        )
        for m in data.selected_moods:
            if m not in detected_moods:
                detected_moods.append(m)
        # Ordenar detected_moods por valor en la distribución final
        detected_moods.sort(key=lambda m: distribution.get(m, 0), reverse=True)
    else:
        # Sin selección del usuario: limitar a 3 emociones para claridad visual
        if len(detected_moods) > 3:
            priority_moods = [m for m in detected_moods if m in ["Crisis", "Excelente"]]
            other_moods = sorted(
                [m for m in detected_moods if m not in ["Crisis", "Excelente"]],
                key=lambda m: distribution.get(m, 0),
                reverse=True
            )
            allowed_other = 3 - len(priority_moods)
            final_moods = priority_moods + other_moods[:max(0, allowed_other)]
            detected_moods = final_moods
            distribution = {k: v for k, v in distribution.items() if k in detected_moods}
            total_dist = sum(distribution.values())
            if total_dist > 0:
                distribution = {k: round((v / total_dist) * 100, 1) for k, v in distribution.items()}
    
    # Paso 8: Determinar mood primario (Priorizando emociones específicas)
    if not detected_moods:
        if abs(compound) < 0.1:
            primary_mood = "Indeterminado"
        else:
            primary_mood = "Neutral"
        crisis_level = "normal"
    else:
        if requires_help or "Crisis" in detected_moods:
            primary_mood = "Crisis"
            crisis_level = "critical"
        elif compound >= 0.85:
            primary_mood = "Excelente"
        else:
            primary_mood = max(detected_moods, key=lambda m: distribution.get(m, 0))
            if primary_mood == "Enojo" and not has_crisis_indicators(text_lower):
                requires_help = False
                crisis_level = "normal"
 
    # Paso 9: Calcular confianza
    has_keywords = len(detected_moods) > 0
    score_confidence = min(abs(compound), 1.0)
    base_confidence = (score_confidence + (0.5 if has_keywords else 0.0)) / 1.5

    if distribution:
        max_dist = max(distribution.values())
        if max_dist >= 60:
            dispersion_bonus = 0.15
        elif max_dist >= 40:
            dispersion_bonus = 0.0
        else:
            dispersion_bonus = -0.1
        base_confidence += dispersion_bonus

    if (compound > 0.2 and reinforcement["emoji_score"] < -0.05) or \
       (compound < -0.2 and reinforcement["emoji_score"] > 0.05):
        base_confidence -= 0.2

    confidence = max(min(round(base_confidence, 2), 1.0), 0.1)
    
    # Paso 10: Generar resumen
    human_summary = generate_human_summary(detected_moods, compound, requires_help)
    
    # Filtrar distribución para que solo incluya emociones detectadas (elimina ruido visual)
    distribution = {k: v for k, v in distribution.items() if k in detected_moods}
    total_dist = sum(distribution.values())
    if total_dist > 0:
        distribution = {k: round((v / total_dist) * 100, 1) for k, v in distribution.items()}
    
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
        crisis_level=crisis_level,
        selected_moods=data.selected_moods or []
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
