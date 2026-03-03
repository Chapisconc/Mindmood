"""
text_processing.py — Preprocesamiento de texto para el Diario Personal Inteligente.

Responsabilidades:
  - Tokenización en oraciones (sentence splitting).
  - Limpieza básica de texto.
  - Extracción de palabras emocionales clave usando léxico VADER interno.
  - Detección de negadores y amplificadores.

Nota: VADER maneja internamente acentos y emojis, por lo que no se elimina
      la puntuación ni se convierte a minúsculas antes de pasarlo a VADER.
      La limpieza aquí es sólo para estadísticas de palabras.
"""

import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from collections import Counter

# ─── Descarga de recursos NLTK ───────────────────────────────────────────────
# Se llama una sola vez; si ya existe no re-descarga.

def ensure_nltk_resources() -> None:
    """Descarga los recursos NLTK necesarios si no están presentes."""
    resources = [
        ("tokenizers/punkt", "punkt"),
        ("tokenizers/punkt_tab", "punkt_tab"),
    ]
    for path, package in resources:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(package, quiet=True)


# ─── Léxico emocional propio (subconjunto de palabras cargadas por VADER) ────
# Estas listas sirven para resaltar palabras en la UI y contar palabras emocionales.
# Se clasifican en positivas y negativas a modo de referencia visual, no de análisis.

POSITIVE_KEYWORDS: set[str] = {
    "happy", "joy", "love", "excellent", "wonderful", "fantastic", "great",
    "amazing", "good", "beautiful", "awesome", "brilliant", "delight",
    "excited", "grateful", "hopeful", "inspired", "laugh", "lucky", "perfect",
    "pleased", "proud", "smile", "success", "thankful", "terrific", "thrilled",
    "trust", "victory", "win", "adore", "bliss", "celebrate", "cheerful",
    "content", "energized", "fun", "generous", "glad", "harmony", "incredible",
    "joyful", "kind", "lively", "magnificent", "marvelous", "optimistic",
    "peaceful", "radiant", "remarkable", "sensational", "spectacular", "superb",
    "uplifting", "vibrant", "warm", "zeal",
    # Español
    "feliz", "alegre", "amor", "excelente", "maravilloso", "fantástico",
    "genial", "increíble", "bueno", "hermoso", "contento", "emocionado",
    "agradecido", "esperanzado", "inspirado", "risas", "afortunado", "perfecto",
    "orgulloso", "sonrisa", "éxito", "extraordinario", "brillante",
}

NEGATIVE_KEYWORDS: set[str] = {
    "sad", "hate", "terrible", "awful", "horrible", "bad", "worst", "ugly",
    "angry", "fear", "depressed", "miserable", "painful", "disgusting",
    "annoying", "frustrated", "hopeless", "lonely", "pathetic", "rage",
    "regret", "shame", "stress", "worried", "worthless", "anxious", "broken",
    "cruel", "dark", "defeat", "despair", "disgust", "dread", "evil",
    "failure", "furious", "grief", "guilty", "heartbroken", "helpless",
    "hurt", "jealous", "misery", "nightmare", "panic", "sorrow", "suffering",
    "tragedy", "ugly", "unhappy", "upset", "vile", "violent", "weak",
    # Español
    "triste", "odio", "terrible", "horrible", "malo", "peor", "feo",
    "enojado", "miedo", "deprimido", "miserable", "doloroso", "asqueroso",
    "molesto", "frustrado", "desesperado", "solo", "patético", "rabia",
    "arrepentido", "vergüenza", "estrés", "preocupado", "inútil", "ansioso",
    "roto", "oscuro", "derrota", "desesperación", "asco", "terror", "fracaso",
}

NEGATION_WORDS: set[str] = {
    "not", "no", "never", "nobody", "nothing", "neither", "nor", "none",
    "cannot", "can't", "won't", "don't", "doesn't", "didn't", "isn't",
    "wasn't", "aren't", "weren't", "shouldn't", "wouldn't", "couldn't",
    # Español
    "no", "nunca", "jamás", "nadie", "nada", "ni", "tampoco",
}

INTENSIFIER_WORDS: set[str] = {
    "very", "extremely", "incredibly", "absolutely", "totally", "completely",
    "utterly", "massively", "highly", "deeply", "profoundly", "overwhelmingly",
    "remarkably", "insanely", "terribly", "awfully", "dreadfully",
    # Español
    "muy", "extremadamente", "increíblemente", "absolutamente", "totalmente",
    "completamente", "profundamente", "altamente", "demasiado",
}


# ─── Funciones públicas ───────────────────────────────────────────────────────

def split_into_sentences(text: str) -> list[str]:
    """
    Divide el texto en oraciones usando NLTK sent_tokenize.

    NLTK usa el tokenizador Punkt (no supervisado), que detecta
    abreviaturas y límites de oración con mayor precisión que un
    simple split por '.'.

    Parámetros
    ----------
    text : texto libre del usuario

    Retorna
    -------
    Lista de oraciones no vacías.
    """
    ensure_nltk_resources()
    sentences = sent_tokenize(text.strip())
    # Filtrar cadenas vacías o de un sólo carácter
    return [s.strip() for s in sentences if len(s.strip()) > 1]


def clean_text(text: str) -> str:
    """
    Limpieza básica para análisis estadístico de palabras
    (NO se aplica al texto que va a VADER).

    - Convierte a minúsculas
    - Elimina URLs
    - Contrae espacios múltiples
    """
    text = text.lower()
    text = re.sub(r"https?://\S+", " ", text)   # eliminar URLs
    text = re.sub(r"\s+", " ", text)             # espacios múltiples → 1
    return text.strip()


def extract_emotional_keywords(text: str) -> dict[str, list[str]]:
    """
    Identifica palabras positivas y negativas presentes en el texto.

    Algoritmo
    ---------
    1. Limpia el texto y tokeniza en palabras.
    2. Para cada token, verifica si pertenece a POSITIVE_KEYWORDS o NEGATIVE_KEYWORDS.
    3. Devuelve listas (con posibles repeticiones) para contar frecuencia.

    Parámetros
    ----------
    text : texto libre (limpieza interna)

    Retorna
    -------
    dict con claves "positive" y "negative", cada una con lista de palabras.
    """
    cleaned = clean_text(text)
    # Extraer tokens sólo alfanuméricos
    tokens = re.findall(r"\b[a-záéíóúüñ]+\b", cleaned)

    positives = [t for t in tokens if t in POSITIVE_KEYWORDS]
    negatives = [t for t in tokens if t in NEGATIVE_KEYWORDS]

    return {"positive": positives, "negative": negatives}


def count_negations(text: str) -> int:
    """Cuenta palabras de negación en el texto (para análisis contextual)."""
    cleaned = clean_text(text)
    tokens = re.findall(r"\b[a-záéíóúüñ']+\b", cleaned)
    return sum(1 for t in tokens if t in NEGATION_WORDS)


def count_intensifiers(text: str) -> int:
    """Cuenta palabras amplificadoras/intensificadoras en el texto."""
    cleaned = clean_text(text)
    tokens = re.findall(r"\b[a-záéíóúüñ]+\b", cleaned)
    return sum(1 for t in tokens if t in INTENSIFIER_WORDS)


def word_count(text: str) -> int:
    """Número de palabras en el texto (sin limpiar)."""
    return len(text.split())


def most_common_emotional_words(text: str, top_n: int = 5) -> dict[str, list[tuple[str, int]]]:
    """
    Top-N palabras emocionales más frecuentes.

    Retorna
    -------
    {"positive": [(palabra, freq), ...], "negative": [(palabra, freq), ...]}
    """
    kw = extract_emotional_keywords(text)
    pos_counter = Counter(kw["positive"])
    neg_counter = Counter(kw["negative"])
    return {
        "positive": pos_counter.most_common(top_n),
        "negative": neg_counter.most_common(top_n),
    }
