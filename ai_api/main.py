"""
Pipeline principal de IA para MindMood
=======================================
Autor:        RAMIREZ RUIZ, CRISTOPHER SAID
Curso:        SEMINARIO DE INGENIERIA DE SOFTWARE, Seccion D15, CUCEI

Descripcion:
    Este archivo implementa un pipeline completo de analisis de sentimiento
    en 10 etapas para la PWA Diario Inteligente (MindMood). Utiliza modelos
    de HuggingFace (pysentimiento/robertuito) para clasificar emociones en
    texto en espanol con soporte para jerga mexicana.

Pipeline de 10 etapas:
    1. Recepcion del texto via endpoint POST /analyze
    2. Limpieza: eliminacion de emojis y normalizacion de acentos
    3. Normalizacion de jerga mexicana (reemplazo de slang)
    4. Analisis de sentimiento base (Robertuito POS/NEG/NEU)
    5. Refuerzo emocional: mayusculas (gritos) e intensificadores
    6. Analisis de emociones detallado (Robertuito emotion)
    7. Filtro de polaridad y limpieza por contradiccion
    8. Refuerzo por palabras clave (keyword spotting)
    9. Deteccion de crisis/suicidio (spellcheck + fuzzy matching)
    10. Generacion de resumen empatico con recomendaciones

Endpoints expuestos:
    - POST /analyze   -> Analisis de sentimiento completo
    - GET  /health    -> Health check del servicio
    - GET  /          -> Pagina de bienvenida con informacion de la API

Dependencias principales:
    - FastAPI + uvicorn       -> Servidor web asincrono
    - pydantic                -> Validacion de esquemas
    - transformers            -> Modelos HuggingFace (robertuito)
    - pysentimiento           -> Modelos pre-entrenados para espanol
    - emoji                   -> Deteccion y remocion de emojis
    - spellchecker            -> Corrector ortografico (deteccion de crisis)
    - difflib                 -> Fuzzy matching para typos en palabras clave

Rate Limiter:
    Implementacion por memoria (dict) con ventana deslizante de 60s
    y maximo de 10 requests por IP.
"""

# ============================================================================
# IMPORTACIONES - Librerias de FastAPI y validacion de datos
# ============================================================================
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware

# ============================================================================
# IMPORTACIONES - Modelos de lenguaje (HuggingFace Transformers)
# ============================================================================
from transformers import pipeline
from functools import lru_cache

# ============================================================================
# IMPORTACIONES - Utilidades del sistema (regex, logging, JSON, emoji, tiempo, archivos)
# ============================================================================
import re
import logging
import json
import emoji
import time
import os
from collections import defaultdict
import unicodedata
import secrets
from difflib import SequenceMatcher

# ============================================================================
# IMPORTACIONES - Corrector ortografico y tipado
# ============================================================================
from spellchecker import SpellChecker
from typing import List, Dict
 
# Configurar logging para crisis - solo se registran WARNING y superior
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

# Crear la aplicacion FastAPI con metadatos del servicio
app = FastAPI(title="Sentiment Analyzer API", version="2.0")

# ============================================================================
# ENDPOINT: GET / - Pagina de bienvenida / informacion de la API
# ============================================================================
@app.get("/")
def read_root():
    """Endpoint raiz que muestra el estado del motor de IA y los endpoints disponibles"""
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
# CONFIGURACION CORS - Solo origenes conocidos (lista blanca)
# ============================================================================
# Leer origenes permitidos desde variable de entorno, o usar lista por defecto
# Si CORS_ORIGINS esta definida, se separa por comas; si no, se usa la lista fija
ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "").split(",") if os.environ.get("CORS_ORIGINS") else [
    "http://127.0.0.1:8000",       # Servidor local
    "http://localhost:5173",        # Frontend en desarrollo (Vite)
    "http://localhost:4173",        # Frontend en preview (Vite)
    "https://mindmood.vercel.app",  # Produccion en Vercel
    "https://mindmood-web.vercel.app",  # Produccion alternativa en Vercel
]
# Registrar el middleware CORS con la lista blanca de origenes
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,       # Solo estos origenes pueden hacer peticiones
    allow_credentials=False,             # No se permiten cookies/credenciales cross-origin
    allow_methods=["POST", "GET", "OPTIONS"],  # Metodos HTTP permitidos
    allow_headers=["Content-Type", "ngrok-skip-browser-warning"],  # Headers permitidos
)

# ============================================================================
# RATE LIMITER POR MEMORIA - Ventana deslizante de 60s, 10 requests por IP
# ============================================================================
# Duracion de la ventana de tiempo en segundos (60s = 1 minuto)
RATE_LIMIT_WINDOW = 60
# Numero maximo de solicitudes permitidas por ventana por direccion IP
RATE_LIMIT_MAX = 10
# Almacen en memoria de los timestamps de cada solicitud por IP (estructura: {IP: [timestamps...]})
_rate_store = defaultdict(list)

async def rate_limiter(request: Request, call_next):
    """Middleware de rate limiting: permite maximo RATE_LIMIT_MAX requests por ventana de RATE_LIMIT_WINDOW segundos por IP."""
    # Obtener la direccion IP del cliente; si no esta disponible, usar "unknown"
    client_ip = request.client.host if request.client else "unknown"
    # Timestamp actual en segundos desde epoch
    now = time.time()
    # Limite inferior de la ventana (hace 60 segundos)
    window_start = now - RATE_LIMIT_WINDOW

    # Filtrar el historial: conservar solo los timestamps dentro de la ventana actual
    _rate_store[client_ip] = [t for t in _rate_store[client_ip] if t > window_start]

    # Si se excede el limite, responder con HTTP 429 (Too Many Requests)
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

    # Registrar el timestamp actual y continuar con la solicitud
    _rate_store[client_ip].append(now)
    response = await call_next(request)
    return response

# Registrar el middleware de rate limiting en la aplicacion FastAPI
app.middleware("http")(rate_limiter)
 
# ============================================================================
# CARGA DE MODELOS DE HUGGINGFACE - Robertuito (pysentimiento)
# ============================================================================
# Pipeline #1: Analisis de sentimiento base (POS/NEG/NEU)
# Modelo: pysentimiento/robertuito-sentiment-analysis
# Entrenado con tweets en espanol, soporta lenguaje informal y jerga
logger.info("Cargando modelo robertuito-sentiment-analysis. Esto puede tomar unos segundos...")
sentiment_pipeline = pipeline(
    "sentiment-analysis",                          # Tarea: clasificacion de sentimiento ternaria
    model="pysentimiento/robertuito-sentiment-analysis",   # Modelo pre-entrenado
    tokenizer="pysentimiento/robertuito-sentiment-analysis", # Tokenizador compatible
    device=-1                                      # -1 = CPU, 0+ = GPU (CUDA)
)
# Pipeline #2: Analisis de emociones detallado (joy, sadness, anger, fear, etc.)
# Retorna puntuaciones para todas las clases (return_all_scores=True)
logger.info("Cargando modelo robertuito-emotion-analysis para análisis detallado...")
emotion_pipeline = pipeline(
    "text-classification",                         # Tarea: clasificacion multi-clase
    model="pysentimiento/robertuito-emotion-analysis",    # Modelo pre-entrenado para emociones
    tokenizer="pysentimiento/robertuito-emotion-analysis", # Tokenizador compatible
    return_all_scores=True,                        # Devolver scores de TODAS las clases, no solo la ganadora
    device=-1                                      # -1 = CPU
)
logger.info("Modelos cargados exitosamente.")
 
# ============================================================================
# DICCIONARIO DE PALABRAS CLAVE EMOCIONALES - Para refuerzo post-modelo
# ============================================================================
# Este diccionario asocia categorias emocionales con listas de palabras clave en espanol.
# Se usa como respaldo (backup) del modelo de HuggingFace para:
#   1. Detectar emociones que el modelo podria haber omitido
#   2. Refinar la distribucion emocional final
#   3. Detectar crisis con alta prioridad
# Cada entrada: categoria -> [lista de palabras/frases clave en minusculas]

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
    # Categoria especial: Crisis/Suicidio
    # Tiene la maxima prioridad en el pipeline. Si se detecta, anula cualquier otra emocion
    # y fuerza la respuesta a "requires_help: true" con crisis_level "critical"
    'Crisis': [
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

# ============================================================================
# NORMALIZACION DE ACENTOS - Eliminar diacriticos para busqueda insensible
# ============================================================================
# Importar unicodedata para descomposicion Unicode NFKD (separa acentos de letras)
import unicodedata
def _quick_remove_accents(input_str):
    """Eliminar acentos/diacriticos de un string usando descomposicion Unicode NFKD"""
    # Normalizar a forma NFKD: separa caracteres base de sus diacriticos
    nfkd_form = unicodedata.normalize('NFKD', str(input_str))
    # Filtrar solo los caracteres que NO son diacriticos (categoria 'Mn' = Mark, Nonspacing)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

# Reconstruir EMOTION_KEYWORDS: convertir cada palabra clave a minusculas y sin acentos
# Esto permite busqueda insensible a mayusculas y acentos en el texto del usuario
EMOTION_KEYWORDS = {
    cat: [ _quick_remove_accents(kw.lower()) for kw in kws ] 
    for cat, kws in EMOTION_KEYWORDS.items()
}

# ============================================================================
# REFUERZO EMOCIONAL - Detectores de intensidad (mayusculas/gritos y emojis)
# ============================================================================
# Conjunto de emojis con connotacion positiva (alegria, celebracion, amor, exito)
POSITIVE_EMOJIS = {'😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🥳', '😏', '😌', '🤤', '🤠', '🥳', '😎', '✨', '🔥', '🚀', '⭐', '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'}
# Conjunto de emojis con connotacion negativa (tristeza, enojo, dolor, peligro)
NEGATIVE_EMOJIS = {'☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '🤬', '😡', '😠', '🙄', '🤨', '😒', '💬', '💔', '🥀', '💀', '☠️', '🏚️', '🌧️', '⛈️', '🌪️', '🌫️', '🥀'}

def analyze_emotional_reinforcement(text: str) -> dict:
    """
    Analizar el refuerzo emocional del texto basado en dos seniales:
      1. Uso de MAYUSCULAS sostenidas (gritos) -> incrementa intensidad
      2. Emojis positivos/negativos -> ajusta el score emocional

    Parametros:
        text (str): Texto original del usuario (antes de eliminar emojis)

    Retorna:
        dict: {
            "multiplier" (float): Factor multiplicador de intensidad (1.0 por defecto, 1.2 si hay gritos)
            "emoji_score" (float): Puntaje acumulado de emojis, limitado a +/-0.2
        }
    """
    # Factor base de intensidad (sin modificacion)
    intensity_boost = 1.0
    # Puntaje emocional acumulado por emojis
    emoji_sentiment = 0.0
    
    # Analisis #1: Deteccion de GRITOS (uso excesivo de mayusculas en palabras de 3+ caracteres)
    # Si mas del 30% de las palabras largas estan en mayusculas, se considera "grito"
    words = text.split()                                    # Segmentar el texto en palabras
    caps_words = [w for w in words if w.isupper() and len(w) > 2]  # Filtrar palabras EN MAYUSCULAS con longitud > 2
    # Si hay al menos una palabra en mayusculas y superan el 30% del total, activar boost
    if len(caps_words) > 0 and len(caps_words) >= len(words) * 0.3:
        intensity_boost = 1.2  # Incrementar intensidad en un 20%
        
    # Analisis #2: Recorrer caracter por caracter para detectar emojis
    for char in text:
        if char in POSITIVE_EMOJIS:
            emoji_sentiment += 0.05   # Cada emoji positivo suma +0.05
        elif char in NEGATIVE_EMOJIS:
            emoji_sentiment -= 0.05   # Cada emoji negativo resta -0.05
            
    return {
        "multiplier": intensity_boost,
        # Limitar el score de emojis a un maximo de +/-0.2 para evitar sesgos extremos
        "emoji_score": max(min(emoji_sentiment, 0.2), -0.2)
    }

# ============================================================================
# NORMALIZACION DE JERGA MEXICANA Y CORRECTOR ORTOGRAFICO
# ============================================================================
# Inicializar el corrector ortografico en espanol (usando pyspellchecker con diccionario es)
# Se usa principalmente para tolerancia a errores en la deteccion de crisis
spell = SpellChecker(language='es')

def load_mexican_slang():
    """
    Cargar el dataset de jerga mexicana desde un archivo JSON.

    El archivo mexican_slang_dataset.json contiene un diccionario de
    patrones de jerga mexicana y sus reemplazos al espanol estandar.

    Retorna:
        dict: Diccionario {patron_jerga: reemplazo_espanol}, o dict vacio si hay error
    """
    try:
        # Obtener el directorio donde se encuentra este archivo (main.py)
        base_dir = os.path.dirname(__file__)
        # Construir la ruta completa al archivo de dataset
        dataset_path = os.path.join(base_dir, "mexican_slang_dataset.json")
        # Cargar y retornar el JSON
        with open(dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        # Si el archivo no existe o hay error, registrar advertencia y retornar vacio
        logger.error(f"Error cargando mexican_slang_dataset.json: {e}")
        return {}

# Cargar el dataset de jerga mexicana al iniciar el modulo (una sola vez)
MEXICAN_SLANG = load_mexican_slang()

# Compilar los patrones de jerga como expresiones regulares con bordes de palabra (\b)
# Esto asegura que solo se reemplacen palabras completas, no subcadenas
# Ejemplo: "\bwey\b" no hara match en "chocolatey" (a menos que tenga "wey" como palabra independiente)
compiled_slang = {re.compile(r'\b' + pattern + r'\b'): replacement for pattern, replacement in MEXICAN_SLANG.items()}
 
# ============================================================================
# INTENSIFICADORES Y NEGACIONES - Moduladores de intensidad emocional
# ============================================================================
# Diccionario de palabras intensificadoras del espanol, cada una con un factor
# multiplicador que incrementa la intensidad emocional del texto.
# Ejemplo: "muy feliz" tiene mas peso que "feliz" solo
INTENSIFICADORES = {
    'super': 1.4, 'extremadamente': 1.5, 'completamente': 1.35,
    'totalmente': 1.35, 'absolutamente': 1.4, 'realmente': 1.25, 'verdaderamente': 1.25,
    'sumamente': 1.4, 'excesivamente': 1.35, 'increíblemente': 1.3,
    'demasiado': 1.3, 'bien': 1.15, 'mucho': 1.2, 'bastante': 1.2,
    'muy': 1.3,
}
# Conjunto de palabras de negacion en espanol
# Si se detecta una negacion, puede invertir el sentimiento de las palabras siguientes
NEGACIONES = {'no', 'ni', 'nunca', 'jamás', 'nada', 'nadie', 'tampoco', 'sin'}
 

 
# ============================================================================
# FUNCIONES DE ANALISIS AUXILIARES
# ============================================================================

def detect_negation(text: str) -> bool:
    """
    Detectar si el texto contiene alguna palabra de negacion.

    Analiza palabra por palabra en el texto normalizado a minusculas
    y verifica si alguna coincide con el conjunto NEGACIONES.

    Parametros:
        text (str): Texto a analizar

    Retorna:
        bool: True si se encontro al menos una negacion, False en caso contrario
    """
    # Tokenizar el texto en palabras y normalizar a minusculas
    words = text.lower().split()
    for i, word in enumerate(words):
        # Si alguna palabra pertenece al conjunto de negaciones, retornar True
        if word in NEGACIONES:
            return True
    return False

def get_intensifier_multiplier(text: str) -> float:
    """
    Calcular el factor multiplicador de intensidad emocional basado en palabras intensificadoras.

    Recorre el texto buscando palabras del diccionario INTENSIFICADORES y
    multiplica sus factores acumulativamente. El resultado maximo esta limitado a 1.5.

    Parametros:
        text (str): Texto a analizar

    Retorna:
        float: Factor multiplicador entre 1.0 y 1.5
    """
    words = text.lower().split()
    multiplier = 1.0
    for word in words:
        # Si la palabra actual es un intensificador conocido, multiplicar su factor
        if word in INTENSIFICADORES:
            multiplier *= INTENSIFICADORES[word]
    # Limitar el multiplicador maximo a 1.5 (50% de incremento maximo)
    return min(multiplier, 1.5)

def normalize_mexican_slang(text: str) -> str:
    """
    Normalizar jerga mexicana reemplazando patrones de slang con espanol estandar.

    Aplica las expresiones regulares compiladas (compiled_slang) para reemplazar
    cada patron de jerga por su equivalente en espanol formal.

    Parametros:
        text (str): Texto original que puede contener jerga mexicana

    Retorna:
        str: Texto normalizado sin jerga, listo para el analisis de HuggingFace
    """
    for pattern, replacement in compiled_slang.items():
        # Aplicar cada regex de reemplazo sobre el texto
        text = pattern.sub(replacement, text)
    return text

def has_crisis_indicators(text: str) -> bool:
    """
    Detectar indicadores de crisis/suicidio en el texto con tres niveles de busqueda.

    Estrategia en cascada (si un nivel detecta, retorna True inmediatamente):
      1. Busqueda directa de palabras clave de crisis en EMOTION_KEYWORDS['Crisis']
      2. Tolerancia a errores ortograficos usando SpellChecker y fuzzy matching (difflib)
      3. Patrones regex de frases completas indicadoras de crisis

    Parametros:
        text (str): Texto del usuario en minusculas

    Retorna:
        bool: True si se detectaron indicadores de crisis, False en caso contrario
    """
    
    # Normalizar texto: minusculas y sin acentos para busqueda robusta
    text_lower = text.lower()
    text_no_accents = _quick_remove_accents(text_lower)
    # Obtener las palabras clave de la categoria Crisis del diccionario global
    crisis_keywords = EMOTION_KEYWORDS.get('Crisis', [])
    
    # NIVEL 1: Busqueda directa de palabras clave (mas rapida)
    for keyword in crisis_keywords:
        if keyword in text_no_accents:
            return True
            
    # NIVEL 2: Tolerancia a errores ortograficos (fuzzy matching)
    # Solo se ejecuta si el nivel 1 no detecto nada
    # Analizar palabra por palabra para detectar typos en terminos criticos
    words = text_no_accents.split()
    critical_stems = ['matar', 'suicidio', 'suicida', 'morir', 'morirme', 'matarme', 'adios', 'despedida']
    
    for word in words:
        # Ignorar palabras cortas (menos de 4 caracteres) para evitar falsos positivos
        if len(word) < 4:
            continue
        # Verificar si la palabra es exactamente un stem critico
        if word in critical_stems:
            return True
        
        # Usar el corrector ortografico para palabras sospechosas
        try:
            # Opcion A: Corrector ortografico estandar (SpellChecker)
            corrected = spell.correction(word)
            if corrected and _quick_remove_accents(corrected) in critical_stems:
                return True
            
            # Opcion B: Similitud de caracteres (Fuzzy matching con difflib)
            # Detecta palabras con errores de una letra (ej. "maatr" -> "matar")
            for stem in critical_stems:
                # Si la similitud entre la palabra y el stem es mayor al 80%, es positivo
                if SequenceMatcher(None, word, stem).ratio() > 0.8:
                    return True
        except (ValueError, TypeError):
            pass
    
    # NIVEL 3: Patrones regex de frases completas indicadoras de crisis
    # Captura frases como "no aguanto mas", "me quiero morir", etc.
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
# MODELOS PYDANTIC - Esquemas de validacion de datos de entrada y salida
# ============================================================================

class AnalyzeRequest(BaseModel):
    """
    Modelo de solicitud para el endpoint POST /analyze.

    Atributos:
        text (str): Texto a analizar, longitud entre 3 y 2000 caracteres.
        language (str): Idioma del texto (por defecto 'es' para espanol).
    """
    text: str = Field(..., min_length=3, max_length=2000,
                      description="Texto a analizar (3-2000 caracteres)")
    language: str = Field(default="es", description="Idioma del texto")

    @field_validator('text')
    @classmethod
    def text_not_empty(cls, v):
        """Validador: asegurar que el texto no sea solo espacios en blanco"""
        if not v.strip():
            raise ValueError('El texto no puede estar vacío')
        return v.strip()

class AnalysisResponse(BaseModel):
    """
    Modelo de respuesta para el endpoint POST /analyze.

    Atributos:
        mood (str): Emocion primaria detectada (ej. "Feliz", "Triste", "Crisis")
        all_moods (List[str]): Lista de todas las emociones detectadas (max 3)
        emotions_distribution (Dict[str, float]): Distribucion porcentual de cada emocion
        score (float): Puntaje compuesto de sentimiento (-1.0 a 1.0)
        confidence (float): Nivel de confianza del analisis (0.1 a 1.0)
        summary (str): Resumen empatico generado con recomendaciones
        requires_help (bool): Indica si se detectaron indicadores de crisis
        crisis_level (str): Nivel de crisis: "normal" o "critical"
    """
    mood: str
    all_moods: List[str]
    emotions_distribution: Dict[str, float]
    score: float
    confidence: float
    summary: str
    requires_help: bool
    crisis_level: str
 
# ============================================================================
# GENERACION DE RESUMEN EMPATICO - Narrativa psicologica con recomendaciones
# ============================================================================

def generate_human_summary(moods, compound_score, requires_help=False):
    """
    Generar un resumen empatico, profundo y con recomendaciones psicologicas
    basado en las emociones detectadas y el puntaje compuesto.

    El resumen incluye:
      1. Intro basada en la intensidad del score compuesto
      2. Combinacion narrativa de emociones cuando hay multiples detectadas
      3. Reflexion/insight psicologico seleccionado aleatoriamente de una base
         de datos de sugerencias por emocion

    Parametros:
        moods (list): Lista de emociones detectadas ordenadas por relevancia
        compound_score (float): Puntaje compuesto de sentimiento (-1.0 a 1.0)
        requires_help (bool): Si es True, retorna un mensaje de crisis prioritario

    Retorna:
        str: Texto del resumen en espanol, listo para mostrar al usuario
    """
    # Si se detecto crisis, retornar mensaje de apoyo urgente (prioridad maxima)
    if requires_help:
        return (
            "Noto que estás pasando por un momento abrumador y crítico. "
            "Es completamente válido sentir que no puedes más, pero tu bienestar es vital. "
            "Por favor, considera hablar con un profesional, la carga compartida es más ligera. "
            "Existen líneas de apoyo gratuitas y confidenciales. ¡No estás solo/a en esta oscuridad! 💙"
        )

    # Si no se detectaron emociones, retornar mensaje neutral por defecto
    if not moods:
        return "Tu entrada parece muy neutral. A veces la calma y la ausencia de picos emocionales es el mejor momento para reflexionar sobre lo que realmente valoramos en el día a día."
    
    # La emocion principal es la primera de la lista (mas relevante)
    primary = moods[0]
    
    # Base de datos de sugerencias psicologicas ricas y profundas por emocion
    # Cada emocion tiene 2 variantes para variedad en las respuestas
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

    # Seleccionar un insight aleatorio de la base de datos usando secrets
    insight = secrets.choice(insights.get(primary, insights['Neutral']))
    
    # Construir la narrativa de introduccion basada en la polaridad del score compuesto
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

    # Detectar combinaciones de emociones para enriquecer la narrativa
    if len(moods) > 1:
        # Si la emocion principal es negativa pero hay tristeza secundaria
        if primary in ['Enojo', 'Ansiedad'] and 'Triste' in moods:
            blend = f" Es completamente natural que detrás de ese {primary.lower()} se esconda también tristeza."
        # Si hay alegria combinada con gratitud
        elif primary in ['Feliz', 'Excelente'] and 'Agradecido' in moods:
            blend = " La alegría combinada con gratitud es la receta perfecta para un día memorable."
        # Cualquier otra combinacion de emociones
        else:
            blend = f" Además de {primary.lower()}, noto matices de {moods[1].lower()} en tu relato."
    else:
        blend = ""

    return f"{intro}{blend}\n\n💡 Reflexión: {insight}"

 
# La emocion final la determina exclusivamente Robertuito (HuggingFace).
# Sin intervencion del usuario — solo se analiza el texto recibido.

# ============================================================================
# ENDPOINT PRINCIPAL: POST /analyze - Pipeline completo de analisis en 10 etapas
# ============================================================================

@app.post("/analyze", response_model=AnalysisResponse)
def analyze(data: AnalyzeRequest):
    """
    Endpoint principal de analisis de sentimiento.

    Ejecuta el pipeline completo de 10 etapas:
      1. Limpieza y normalizacion del texto
      2. Normalizacion de jerga mexicana
      3. Analisis de sentimiento base con modelo HuggingFace
      4. Refuerzo emocional (intensificadores, mayusculas, emojis)
      5. Deteccion de crisis
      6. Analisis detallado de emociones (Robertuito emotion)
      7. Filtro de polaridad por contradiccion
      8. Refuerzo por palabras clave
      9. Calculo de confianza
      10. Generacion de resumen empatico

    Parametros:
        data (AnalyzeRequest): Cuerpo de la solicitud con el texto y el idioma

    Retorna:
        AnalysisResponse: JSON con mood, all_moods, emotions_distribution,
                          score, confidence, summary, requires_help, crisis_level
    """
    # ========================================================================
    # ETAPA 1: Limpieza del texto - eliminar emojis y normalizar a minusculas
    # ========================================================================
    # Guardar texto original con emojis para refuerzo emocional
    raw_text = data.text
    # Eliminar todos los emojis del texto para que sea texto plano puro
    original_text = emoji.replace_emoji(data.text, replace='')
    # Convertir a minusculas para busqueda insensible
    text_lower = original_text.lower()
    
    # Texto sin acentos para busqueda de palabras clave (keyword spotting)
    text_no_accents = _quick_remove_accents(text_lower)
    
    # ========================================================================
    # ETAPA 2: Normalizar jerga mexicana a espanol estandar
    # ========================================================================
    # Reemplazar expresiones de slang mexicano (ej. "wey", "chido", "chamba")
    # por sus equivalentes en espanol formal para mejorar el analisis del modelo
    normalized_text = normalize_mexican_slang(original_text)
    
    # ========================================================================
    # ETAPA 3: Analisis de sentimiento base con modelo HuggingFace
    # ========================================================================
    try:
        # Truncar a 1500 caracteres como precaucion (el modelo maneja bien hasta ~512 tokens)
        hf_result = sentiment_pipeline(normalized_text[:1500])[0]
        # Etiqueta de sentimiento: 'POS' (positivo), 'NEG' (negativo), 'NEU' (neutral)
        label = hf_result['label']
        # Puntaje de confianza del modelo (0.0 a 1.0)
        hf_score = hf_result['score']
        
        # Convertir el resultado del modelo a un score compuesto en escala -1..1
        if label == 'POS':
            base_compound = hf_score * 0.9   # Sentimiento positivo: score +0.0 a +0.9
        elif label == 'NEG':
            base_compound = -hf_score * 0.9  # Sentimiento negativo: score -0.9 a -0.0
        else: # NEU
            base_compound = 0.0              # Sentimiento neutral: score 0.0
    except Exception as e:
        # Si el modelo falla, registrar error y usar score neutral por defecto
        logger.error(f"Error en HuggingFace pipeline: {e}")
        base_compound = 0.0
    
    # ========================================================================
    # ETAPA 4: Refuerzo emocional - intensificadores, mayusculas (gritos) y emojis
    # ========================================================================
    # Obtener factores de refuerzo: analizar mayusculas y emojis en el texto original
    reinforcement = analyze_emotional_reinforcement(raw_text)
    # Multiplicador combinado: intensificadores del lenguaje * factor de gritos/mayusculas
    multiplier = get_intensifier_multiplier(original_text) * reinforcement["multiplier"]
    
    # Aplicar el multiplicador al score base y sumar el ajuste por emojis
    compound = base_compound * multiplier
    compound += reinforcement["emoji_score"]
    
    # Limitar el score compuesto al rango [-1.0, 1.0]
    compound = max(min(compound, 1.0), -1.0)
    
    # ========================================================================
    # ETAPA 5: Deteccion de crisis/suicidio (tres niveles de busqueda)
    # ========================================================================
    requires_help = False       # Bandera de alerta de crisis
    crisis_level = "normal"     # Nivel de crisis: "normal" | "critical"
    
    # Si se detectan indicadores de crisis, activar alerta y forzar score muy negativo
    if has_crisis_indicators(text_lower):
        requires_help = True          # Activar bandera de ayuda profesional
        crisis_level = "critical"     # Establecer nivel critico
        compound = -0.95              # Forzar score muy bajo para priorizar crisis
        # Enmascarar el texto original en logs por privacidad (redacted)
        masked = original_text[:50] + "..." if len(original_text) > 50 else original_text[:20]
        logger.warning(f"CRISIS DETECTED: {masked}")
    
    # ========================================================================
    # ETAPA 6: Analisis avanzado de emociones con modelo HuggingFace (Robertuito emotions)
    # ========================================================================
    # Mapeo de etiquetas en ingles del modelo a categorias en espanol
    emotion_map = {
        'joy': 'Feliz',
        'sadness': 'Triste',
        'anger': 'Enojo',
        'surprise': 'Sorpresa',
        'disgust': 'Asco',
        'fear': 'Miedo',
        'others': 'Neutral'
    }
    
    # Diccionario para almacenar la distribucion porcentual de cada emocion
    distribution = {}
    # Lista de emociones detectadas con relevancia significativa (>35%)
    detected_moods = []
    
    try:
        # Ejecutar el pipeline de emociones (retorna scores para todas las clases)
        emotion_results = emotion_pipeline(normalized_text[:1500])[0]
        
        # Mapear cada resultado a su categoria en espanol y calcular porcentajes
        for item in emotion_results:
            # Traducir la etiqueta del modelo (ingles) a categoria emotional (espanol)
            es_label = emotion_map.get(item['label'], 'Neutral')
            # Convertir el score (0.0-1.0) a porcentaje (0.0-100.0)
            percentage = round(item['score'] * 100, 1)
            
            # Si la categoria ya existe en la distribucion, acumular el porcentaje
            if es_label in distribution:
                distribution[es_label] += percentage
            else:
                distribution[es_label] = percentage
                
            # Si el porcentaje supera el 35%, considerarlo como emocion detectada
            # Excluir 'Neutral' para no saturar la lista con falsos positivos
            if percentage > 35.0 and es_label != 'Neutral':
                detected_moods.append(es_label)
                
    except Exception as e:
        # Si el pipeline de emociones falla, usar distribucion indeterminada
        logger.error(f"Error en HuggingFace emotion pipeline: {e}")
        distribution = {"Indeterminado": 100.0}
        
    # Limpiar distribucion: eliminar categorias con porcentaje menor a 0.5% (ruido)
    distribution = {k: round(v, 1) for k, v in distribution.items() if v > 0.5}
    
    # ========================================================================
    # ETAPA 7: Filtro de polaridad - eliminar emociones que contradicen el tono general
    # ========================================================================
    # Se aplica ANTES del refuerzo por keywords para limpiar el ruido del modelo
    # Si el score compuesto es positivo (>0.3), eliminar emociones negativas con bajo peso
    if compound > 0.3:
        negative_emotions = ["Triste", "Enojo", "Miedo", "Asco", "Ansiedad"]
        # Conservar emociones negativas solo si superan el 25% de distribucion
        cleaned_dist = {k: v for k, v in distribution.items() if k not in negative_emotions or v > 25.0}
        if cleaned_dist:
            distribution = cleaned_dist
            detected_moods = [m for m in detected_moods if m not in negative_emotions or distribution.get(m, 0) > 25.0]
    # Si el score compuesto es negativo (<-0.3), eliminar emociones positivas con bajo peso
    elif compound < -0.3:
        positive_emotions = ["Feliz", "Excelente", "Agradecido", "Sorpresa"]
        cleaned_dist = {k: v for k, v in distribution.items() if k not in positive_emotions or v > 25.0}
        if cleaned_dist:
            distribution = cleaned_dist
            detected_moods = [m for m in detected_moods if m not in positive_emotions or distribution.get(m, 0) > 25.0]
    
    # Re-normalizar la distribucion para que la suma sea 100%
    total_dist = sum(distribution.values())
    if total_dist > 0:
        distribution = {k: round((v / total_dist) * 100, 1) for k, v in distribution.items()}
    
    # ========================================================================
    # ETAPA 8: Refuerzo por palabras clave - Keyword spotting con regex de bordes
    # ========================================================================
    # Usar regex con \b (word boundaries) para evitar falsos positivos
    # Ejemplo: "sol" no debe hacer match dentro de "solucion"
    for category, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            try:
                # Compilar patron con bordes de palabra y busqueda insensible a mayusculas
                word_pattern = re.compile(r'\b' + re.escape(kw) + r'\b', re.IGNORECASE)
                # Si la palabra clave aparece en el texto (sin acentos), reforzar la categoria
                if word_pattern.search(text_no_accents):
                    # Agregar la categoria a detected_moods si no estaba ya
                    if category not in detected_moods:
                        detected_moods.append(category)
                    # Asegurar un minimo de 30% en la distribucion para esta categoria
                    distribution[category] = max(distribution.get(category, 0), 30.0)
                    break  # Salir del bucle de keywords (una coincidencia es suficiente)
            except re.error:
                pass
    
    # Si hay indicadores de crisis, forzar la categoria Crisis con prioridad maxima
    if requires_help:
        if "Crisis" not in detected_moods:
            detected_moods.append("Crisis")
        distribution = {"Crisis": 100.0}  # La crisis anula cualquier otra emocion
    # Si el score es muy positivo (>=0.8) y hay felicidad, promover a "Excelente"
    elif compound >= 0.8 and "Feliz" in detected_moods:
        detected_moods.append("Excelente")
        # Mover el porcentaje de Feliz a Excelente (promocion)
        distribution["Excelente"] = distribution.pop("Feliz", 0)

    # ========================================================================
    # ETAPA 8b: Limitar a maximo 3 emociones para claridad visual
    # ========================================================================
    # Si hay mas de 3 emociones detectadas, priorizar "Crisis" y "Excelente" primero
    if len(detected_moods) > 3:
        # Las emociones de prioridad maxima van primero
        priority_moods = [m for m in detected_moods if m in ["Crisis", "Excelente"]]
        # Las demas emociones se ordenan por su porcentaje en la distribucion (mayor primero)
        other_moods = sorted(
            [m for m in detected_moods if m not in ["Crisis", "Excelente"]],
            key=lambda m: distribution.get(m, 0),
            reverse=True
        )
        # Calcular cuantas emociones "normales" caben (maximo 3 en total)
        allowed_other = 3 - len(priority_moods)
        final_moods = priority_moods + other_moods[:max(0, allowed_other)]
        detected_moods = final_moods
        # Filtrar distribucion para incluir solo las emociones seleccionadas
        distribution = {k: v for k, v in distribution.items() if k in detected_moods}
        # Re-normalizar distribucion al 100%
        total_dist = sum(distribution.values())
        if total_dist > 0:
            distribution = {k: round((v / total_dist) * 100, 1) for k, v in distribution.items()}
    
    # ========================================================================
    # ETAPA 9a: Determinar la emocion primaria (mood principal)
    # ========================================================================
    if not detected_moods:
        # Si no se detectaron emociones, usar "Indeterminado" o "Neutral" segun el score
        if abs(compound) < 0.1:
            primary_mood = "Indeterminado"  # Texto sin carga emocional clara
        else:
            primary_mood = "Neutral"
        crisis_level = "normal"
    else:
        # Crisis tiene maxima prioridad: si hay indicadores, forzar "Crisis"
        if requires_help or "Crisis" in detected_moods:
            primary_mood = "Crisis"
            crisis_level = "critical"
        # Si el score es >= 0.85, mood principal es "Excelente"
        elif compound >= 0.85:
            primary_mood = "Excelente"
        else:
            # Mood principal = emocion con mayor porcentaje en la distribucion
            primary_mood = max(detected_moods, key=lambda m: distribution.get(m, 0))
            # Si el mood principal es "Enojo" pero no hay crisis, asegurar banderas normales
            if primary_mood == "Enojo" and not has_crisis_indicators(text_lower):
                requires_help = False
                crisis_level = "normal"
 
    # ========================================================================
    # ETAPA 9b: Calcular el nivel de confianza del analisis
    # ========================================================================
    # Indicador de si hay palabras clave emocionales detectadas
    has_keywords = len(detected_moods) > 0
    # Confianza basada en el valor absoluto del score compuesto (que tan extremo es)
    score_confidence = min(abs(compound), 1.0)
    # Confianza base: promedio entre la confianza del score y la presencia de keywords
    base_confidence = (score_confidence + (0.5 if has_keywords else 0.0)) / 1.5

    # Ajustar por dispersion: si una emocion domina (>60%), bonus; si esta muy dispersa, penalizar
    if distribution:
        max_dist = max(distribution.values())
        if max_dist >= 60:
            dispersion_bonus = 0.15   # Una emocion clara y dominante -> mas confianza
        elif max_dist >= 40:
            dispersion_bonus = 0.0    # Dispersion moderada -> sin ajuste
        else:
            dispersion_bonus = -0.1   # Mucha dispersion -> menos confianza
        base_confidence += dispersion_bonus

    # Penalizar si hay contradiccion entre el score y los emojis
    # Ejemplo: texto positivo con emojis negativos, o viceversa
    if (compound > 0.2 and reinforcement["emoji_score"] < -0.05) or \
       (compound < -0.2 and reinforcement["emoji_score"] > 0.05):
        base_confidence -= 0.2  # Penalizar por senales contradictorias

    # Confianza final: limitada al rango [0.1, 1.0] y redondeada a 2 decimales
    confidence = max(min(round(base_confidence, 2), 1.0), 0.1)
    
    # ========================================================================
    # ETAPA 10: Generar resumen empatico con recomendaciones psicologicas
    # ========================================================================
    human_summary = generate_human_summary(detected_moods, compound, requires_help)
    
    # Filtro final: distribucion solo con emociones detectadas (eliminar ruido visual)
    distribution = {k: v for k, v in distribution.items() if k in detected_moods}
    total_dist = sum(distribution.values())
    if total_dist > 0:
        distribution = {k: round((v / total_dist) * 100, 1) for k, v in distribution.items()}
    
    # Eliminar posibles duplicados en la lista de emociones detectadas
    detected_moods = list(set(detected_moods))
    
    # Construir y retornar la respuesta estructurada segun el modelo AnalysisResponse
    return AnalysisResponse(
        mood=primary_mood,                                  # Emocion principal
        all_moods=detected_moods if detected_moods else ["Neutral"],  # Lista de emociones (max 3)
        emotions_distribution=distribution,                  # Distribucion porcentual
        summary=human_summary,                              # Resumen empatico
        score=round(compound, 3),                           # Score compuesto (-1 a 1)
        requires_help=requires_help,                        # Bandera de alerta de crisis
        confidence=confidence,                              # Nivel de confianza (0.1 a 1.0)
        crisis_level=crisis_level,                          # "normal" o "critical"
    )
 
# ============================================================================
# ENDPOINT: GET /health - Health check y estado del servicio
# ============================================================================

@app.get("/health")
def health_check():
    """
    Endpoint de health check para monitoreo del servicio.

    Retorna el estado actual de la API, la version y las caracteristicas
    disponibles. Util para sistemas de orquestacion y monitoreo (Kubernetes,
    Docker health checks, load balancers, etc.).

    Retorna:
        dict: {
            "status": "healthy" | "unhealthy",
            "version": version del API,
            "features": lista de caracteristicas habilitadas
        }
    """
    return {
        "status": "healthy",
        "version": "2.0",
        "features": ["sentiment_analysis", "crisis_detection", "mexican_slang"]
    }

# ============================================================================
# PUNTO DE ENTRADA - Ejecucion directa del servidor con Uvicorn
# ============================================================================

if __name__ == "__main__":
    """
    Punto de entrada para ejecucion directa: python main.py
    Inicia el servidor Uvicorn en todas las interfaces de red (0.0.0.0)
    en el puerto 8000.
    """
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
