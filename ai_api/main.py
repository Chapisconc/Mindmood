from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from fastapi.middleware.cors import CORSMiddleware
from deep_translator import GoogleTranslator
from functools import lru_cache
import re
import logging
 
# Configurar logging para crisis
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
 
app = FastAPI(title="Sentiment Analyzer API", version="2.0")
 
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
    
    # ❌ NEGATIVOS MODERADOS (Enojo)
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
        'enojado', 'enojada', 'enojo', 'molesto', 'molesta', 'molestia',
        'ira', 'rabia', 'furia', 'furioso', 'furiosa', 'enfurecido', 'enfurecida',
        'frustrado', 'frustrada', 'frustración', 'encabronado', 'encabronada',
        'harto', 'harta', 'irritado', 'irritada', 'irritación',
        'indignado', 'indignada', 'indignación', 'cólera', 'colérico',
        'exasperado', 'exasperada', 'resentido', 'resentida', 'resentimiento',
        'hostil', 'hostilidad', 'despecho', 'malhumor', 'encoleriado',
        'puteado', 'emputado', 'emputada', 'encachimbado', 'ofendido',
        'ultrajado', 'vejado', 'agraviado', 'grosero', 'descontento',
        'denigrado', 'difamado', 'injuriado', 'rebotado', 'encendido',
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
    'Tristeza': [
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
# 🔤 NORMALIZACIÓN DE JERGA MEXICANA (Compilar regex para velocidad)
# ============================================================================
 
MEXICAN_SLANG = {
    r'\bchido\b': 'excelente',
    r'\bchingon\b': 'maravilloso',
    r'\bchingón\b': 'maravilloso',
    r'\brifa\b': 'es el mejor',
    r'\bperron\b': 'fantástico',
    r'\bperrón\b': 'fantástico',
    r'\bpadre\b': 'muy alegre',
    r'\bme late\b': 'me agrada mucho',
    r'\ba huevo\b': 'por supuesto que sí',
    r'\bde pelos\b': 'genial',
    r'\ba toda madre\b': 'fantástico',
    r'\bpoca madre\b': 'excelente',
    r'\bmodo chill\b': 'relajado y tranquilo',
    r'\bsuper top\b': 'excelente',
    r'\bno manches\b': 'es increíble',
    r'\bno mames\b': 'es increíble',
    r'\bal chile\b': 'sinceramente',
    r'\bestá cañon\b': 'está difícil',
    r'\bestá cañón\b': 'está difícil',
    
    # Negativos
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
    r'\bme vale\b': 'me da igual',
    r'\bme vale madre\b': 'no me importa nada',
    r'\bme saca de onda\b': 'me molesta mucho',
    r'\bestoy off\b': 'no tengo ánimos',
    r'\bme está cargando el payaso\b': 'estoy rebasado por los problemas',
    r'\bhasta la madre\b': 'completamente harto',
    r'\bqué oso\b': 'qué vergüenza',
    r'\bque oso\b': 'qué vergüenza',
    r'\bni modo\b': 'no hay de otra',
    r'\bchale\b': 'qué mal',
    r'\bestar de la patada\b': 'estar muy mal',
}
 
# Compilar regex para mejorar velocidad
compiled_slang = {re.compile(pattern): replacement for pattern, replacement in MEXICAN_SLANG.items()}
 
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
 
@lru_cache(maxsize=1000)
def translate_cached(text: str) -> str:
    """Traducir con caché LRU para evitar llamadas repetidas"""
    try:
        translator = GoogleTranslator(source='es', target='en')
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
    
    # Patrones adicionales de crisis
    crisis_patterns = [
        r'no\s+(puedo|aguanto|resisto)',
        r'(quiero|prefiero)\s+(morir|morirme)',
        r'me\s+(corto|duele)',
        r'(mejor|prefiero)\s+(muerto|muerta)',
        r'no\s+hay\s+salida',
        r'insoportable',
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
    all_moods: list
    summary: str
    score: float
    requires_help: bool
    confidence: float
    crisis_level: str  # "normal", "warning", "critical"
 
# ============================================================================
# 🎯 GENERACIÓN DE RESUMEN MEJORADA
# ============================================================================
 
def generate_human_summary(moods, compound_score, requires_help=False):
    """Generar resumen empático y personalizado"""
    human_terms = {
        'Excelente': 'excelente',
        'Feliz': 'felicidad',
        'Agradecido': 'gratitud',
        'Sorpresa': 'asombro',
        'Neutral': 'tranquilidad',
        'Triste': 'tristeza',
        'Enojo': 'enojo',
        'Ansiedad': 'ansiedad',
        'Miedo': 'miedo',
        'Crisis': 'una situación muy difícil',
    }
 
    if requires_help:
        return (
            "Noto que estás pasando por un momento muy difícil. "
            "Tu bienestar es importante. Por favor, considera hablar con alguien "
            "de confianza o contactar a un profesional de la salud mental. "
            "¡No estás solo/a! 💙"
        )
 
    if not moods:
        return "Hoy noto tu energía muy tranquila y equilibrada. Gracias por compartir este momento."
    
    # Mensaje principal basado en intensidad
    if compound_score >= 0.8:
        main_msg = "¡Qué alegría! Se nota que estás teniendo un momento increíble."
    elif compound_score <= -0.8:
        main_msg = "Vaya, se nota que estás pasando por un momento muy pesado. Es valiente que lo pongas en palabras."
    elif compound_score >= 0.2:
        main_msg = "Veo mucha luz en tu mensaje hoy."
    elif compound_score <= -0.2:
        main_msg = "Siento que hoy las cosas están un poco difíciles."
    else:
        main_msg = "Gracias por abrirte y contar cómo te sientes."
 
    # Filtrar moods redundantes
    final_moods = []
    has_specific = any(m in ['Enojo', 'Ansiedad', 'Miedo', 'Agradecido', 'Sorpresa', 'Crisis'] for m in moods)
    
    for m in moods:
        if has_specific and m in ['Triste', 'Feliz', 'Excelente']:
            continue
        if m not in final_moods:
            final_moods.append(m)
    
    if not final_moods: 
        final_moods = moods[:2] if moods else ['Neutral']
 
    if len(final_moods) == 1:
        term = human_terms.get(final_moods[0], final_moods[0].lower())
        details = f" Percibo que hoy sientes {term}."
    elif len(final_moods) == 2:
        t1 = human_terms.get(final_moods[0], final_moods[0].lower())
        t2 = human_terms.get(final_moods[1], final_moods[1].lower())
        details = f" Detecto varios matices: pareces sentir {t1}, pero también percibo algo de {t2}."
    else:
        moods_str = ", ".join([human_terms.get(m, m.lower()) for m in final_moods[:3]])
        details = f" Percibo una mezcla compleja: {moods_str}."
 
    return f"{main_msg}{details}"
 
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
    
    original_text = data.text
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
    
    if detect_negation(original_text):
        # Si hay negación, invertimos el sentimiento de forma controlada
        compound *= -0.8  # Invertir pero reducir intensidad para evitar falsos positivos
    
    # Asegurar que el score se mantenga entre -1 y 1
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
    
    # Buscar keywords de emociones
    for mood_name, keywords in EMOTION_KEYWORDS.items():
        if any(word in text_lower for word in keywords):
            detected_moods.append(mood_name)
    
    # Paso 6: Análisis basado en score
    if not requires_help:  # No agregar moods si ya hay crisis
        if compound >= 0.8:
            detected_moods.append("Excelente")
        elif compound >= 0.1:
            detected_moods.append("Feliz")
        elif compound <= -0.9:  # Ajustado de -0.8 a -0.9 para evitar falsos positivos por enojo
            detected_moods.append("Crisis")
            requires_help = True
            crisis_level = "critical"
        elif compound <= -0.1:
            detected_moods.append("Triste")
    
    # Paso 7: Determinar mood primario (Priorizando emociones específicas)
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
        elif compound >= 0.8: 
            primary_mood = "Excelente"
        elif "Agradecido" in detected_moods: 
            primary_mood = "Agradecido"
        elif "Sorpresa" in detected_moods: 
            primary_mood = "Sorpresa"
        elif "Triste" in detected_moods: 
            primary_mood = "Triste"
        elif "Feliz" in detected_moods: 
            primary_mood = "Feliz"
        else: 
            primary_mood = detected_moods[0] if detected_moods else "Neutral"
 
    # Paso 8: Calcular confianza
    has_keywords = len(detected_moods) > 0
    score_confidence = min(abs(compound), 1.0)
    confidence = (score_confidence + (0.5 if has_keywords else 0.0)) / 1.5
    
    # Penalizar confianza si hay contradicciones (Sarcasmo probable)
    if (compound > 0.2 and reinforcement["emoji_score"] < -0.05) or \
       (compound < -0.2 and reinforcement["emoji_score"] > 0.05):
        confidence -= 0.2
        
    confidence = max(min(round(confidence, 2), 1.0), 0.1)
    
    # Paso 9: Generar resumen
    human_summary = generate_human_summary(detected_moods, compound, requires_help)
    
    # Limpiar moods duplicados
    detected_moods = list(set(detected_moods))
    
    return AnalysisResponse(
        mood=primary_mood,
        all_moods=detected_moods,
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
