"""
sentiment_analysis.py — Motor de análisis de sentimientos con pysentimiento.

════════════════════════════════════════════════════════════════════════════════
PYSENTIMIENTO — FUNDAMENTO TÉCNICO
════════════════════════════════════════════════════════════════════════════════

pysentimiento usa modelos transformer fine-tuned en texto social en español
(Twitter, noticias). El modelo principal para sentimientos es RoBERTuito:

  Referencia: Pérez et al. (2021) "pysentimiento: A Python Toolkit for
  Opinion Mining and Social NLP tasks"

1. MODELO BASE — RoBERTuito
   - Arquitectura: RoBERTa (Robustly Optimized BERT Pretraining Approach)
   - Fine-tuning: corpus de tweets en español (~500M tokens)
   - Salida: 3 etiquetas  POS | NEG | NEU  con probabilidades en [0,1]
   - Las probabilidades suman 1: P(POS) + P(NEG) + P(NEU) = 1

2. MAPEO A COMPOUND EQUIVALENTE
   Necesitamos una escala continua ∈ [-1, 1] compatible con nuestro scoring.

   ┌──────────────────────────────────────────────────────────┐
   │  compound_eq = P(POS) − P(NEG)    ∈ [−1, 1]             │
   │                                                          │
   │  Propiedades:                                            │
   │    Si P(POS)=1, P(NEG)=0 → compound_eq = +1  (muy pos.) │
   │    Si P(NEG)=1, P(POS)=0 → compound_eq = −1  (muy neg.) │
   │    Si P(POS)=P(NEG)=0.5  → compound_eq =  0  (mixto)    │
   │    Si P(NEU)=1            → compound_eq ≈  0  (neutro)   │
   └──────────────────────────────────────────────────────────┘

3. DETECCIÓN DE EMOCIONES (modelo auxiliar)
   pysentimiento incluye un segundo modelo para 6 emociones básicas
   (Ekman, 1992): alegría, tristeza, enojo, miedo, sorpresa, asco.
   Se usa el modelo `robertuito-emotion-analysis` en español.
   Salida: etiquetas joy | sadness | anger | fear | surprise | disgust

════════════════════════════════════════════════════════════════════════════════
SISTEMA DE PUNTUACIÓN PROPIO (CustomMoodScore) — SIN CAMBIOS
════════════════════════════════════════════════════════════════════════════════

  Dado C = [compound_eq₁, compound_eq₂, …, compound_eqₙ] por oración:

  1. μ  = mean(C)
  2. Im = max(|cᵢ|)
  3. ρ  = neg_count / n    (oraciones con compound_eq < -0.05)
  4. Ev = σ / (|μ| + ε)

  S = 0.50·μ  +  0.20·Im·sign(μ)  −  0.20·ρ  −  0.10·Ev
  S ∈ [-1, 1]

  Clasificación:
    S ≥  0.50  →  Muy bueno  🌟
    S ≥  0.10  →  Bueno      😊
    S > -0.10  →  Regular    😐
    S > -0.50  →  Malo       😔
    S ≤ -0.50  →  Muy malo   😢
"""

import math
import numpy as np
import streamlit as st
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor, TimeoutError

from pysentimiento import create_analyzer

from text_preprocessing import fnPreprocessText
from text_processing import (
    split_into_sentences,
    extract_emotional_keywords,
    count_negations,
    count_intensifiers,
)

# ─── Constantes del sistema ───────────────────────────────────────────────────
SHIFT_THRESHOLD  = 0.5
CONTRADICTION_MIN = 0.25
EPSILON = 1e-6

W_MEAN      = 0.50
W_INTENSITY = 0.20
W_NEG_RATIO = 0.20
W_VARIAB    = 0.10

THRESHOLDS = {
    "Muy bueno":  0.50,
    "Bueno":      0.10,
    "Regular":   -0.10,
    "Malo":      -0.50,
}

# Etiquetas de emoción en español para la UI
EMOTION_LABELS_ES = {
    "joy":      "Alegría",
    "sadness":  "Tristeza",
    "anger":    "Enojo",
    "fear":     "Miedo",
    "surprise": "Sorpresa",
    "disgust":  "Asco",
    "others":   "Otras",
}

EMOTION_EMOJIS = {
    "joy":      "😄",
    "sadness":  "😢",
    "anger":    "😠",
    "fear":     "😨",
    "surprise": "😲",
    "disgust":  "🤢",
    "others":   "😶",
}

EMOTION_COLORS = {
    "joy":      "#f59e0b",
    "sadness":  "#3b82f6",
    "anger":    "#ef4444",
    "fear":     "#8b5cf6",
    "surprise": "#06b6d4",
    "disgust":  "#10b981",
    "others":   "#6b7280",
}


@st.cache_resource
def _get_sentiment_analyzer():
    """Retorna el analizador de sentimiento (cache Streamlit)."""
    return create_analyzer(task="sentiment", lang="es")

@st.cache_resource  
def _get_emotion_analyzer():
    """Retorna el analizador de emociones (cache Streamlit)."""
    try:
        return create_analyzer(task="emotion", lang="es")
    except Exception:
        return None


# ─── API pública ──────────────────────────────────────────────────────────────

def analyze_entry(text: str) -> dict:
    """
    Análisis de sentimiento completo de una entrada del diario.

    Usa pysentimiento (RoBERTuito) para análisis por oración y del texto
    completo. Calcula además el sistema de puntuación propio.

    Retorna
    -------
    dict con:
      sentences         : lista de dicts por oración
      compound_mean     : μ de compound_eq por oraciones
      compound_std      : σ de compound_eq
      pos_ratio         : fracción oraciones positivas
      neg_ratio         : fracción oraciones negativas
      neu_ratio         : fracción oraciones neutras
      intensity_max     : max(|compound_eq_i|)
      mood_score        : S ∈ [-1,1] — puntuación propia
      mood_label        : etiqueta textual
      emotional_var     : Ev = σ/(|μ|+ε)
      contradictory     : bool
      abrupt_changes    : int
      key_words         : {"positive":[…], "negative":[…]}
      negation_count    : int
      intensifier_count : int
      sentence_count    : int
      emotions          : {"joy":0.12, "sadness":0.72, …} — texto completo
      dominant_emotion  : str — emoción dominante
    """
    sentences = split_into_sentences(text)
    if not sentences:
        return _empty_result()

    analyzer = _get_sentiment_analyzer()

    # ── 1. Análisis por oración ──────────────────────────────────────────────
    sentence_results = []
    compounds        = []

    for sent in sentences:
        try:
            pred = analyzer.predict(sent)
            # compound_eq = P(POS) - P(NEG)
            p_pos = pred.probas.get("POS", 0.0)
            p_neg = pred.probas.get("NEG", 0.0)
            p_neu = pred.probas.get("NEU", 0.0)
            c = p_pos - p_neg   # compound equivalente ∈ [-1,1]
        except Exception:
            # Fallback si el modelo falla en una oración concreta
            p_pos, p_neg, p_neu, c = 0.0, 0.0, 1.0, 0.0

        compounds.append(c)
        sentence_results.append({
            "text"    : sent,
            "compound": round(c, 4),
            "pos"     : round(p_pos, 4),
            "neg"     : round(p_neg, 4),
            "neu"     : round(p_neu, 4),
            "label"   : _sentence_label(c),
        })

    n = len(compounds)

    # ── 2. Estadísticas agregadas ────────────────────────────────────────────
    arr   = np.array(compounds, dtype=float)
    mu    = float(np.mean(arr))
    sigma = float(np.std(arr))
    Im    = float(np.max(np.abs(arr)))

    pos_count = sum(1 for c in compounds if c >= 0.05)
    neg_count = sum(1 for c in compounds if c <= -0.05)
    neu_count = n - pos_count - neg_count

    pos_ratio = pos_count / n
    neg_ratio = neg_count / n
    neu_ratio = neu_count / n

    # ── 3. Variabilidad emocional relativa ──────────────────────────────────
    emotional_var = sigma / (abs(mu) + EPSILON)

    # ── 4. Puntuación propia ─────────────────────────────────────────────────
    sign_mu = math.copysign(1.0, mu) if mu != 0 else 0.0
    mood_score = (
        W_MEAN      * mu
        + W_INTENSITY * Im * sign_mu
        - W_NEG_RATIO * neg_ratio
        - W_VARIAB    * min(emotional_var, 1.0)
    )
    mood_score = max(-1.0, min(1.0, mood_score))

    # ── 5. Clasificación ─────────────────────────────────────────────────────
    mood_label = _classify(mood_score)

    # ── 6. Cambios bruscos y contradicción ──────────────────────────────────
    abrupt_changes = _count_abrupt_shifts(compounds)
    contradictory  = (pos_ratio > CONTRADICTION_MIN and neg_ratio > CONTRADICTION_MIN)

    # ── 7. Palabras emocionales ──────────────────────────────────────────────
    key_words = extract_emotional_keywords(text)

    # ── 8. Detección de emociones (texto completo) ───────────────────────────
    emotions, dominant_emotion = _analyze_emotions(text)

    return {
        "sentences"        : sentence_results,
        "compound_mean"    : round(mu, 4),
        "compound_std"     : round(sigma, 4),
        "pos_ratio"        : round(pos_ratio, 4),
        "neg_ratio"        : round(neg_ratio, 4),
        "neu_ratio"        : round(neu_ratio, 4),
        "intensity_max"    : round(Im, 4),
        "mood_score"       : round(mood_score, 4),
        "mood_label"       : mood_label,
        "emotional_var"    : round(emotional_var, 4),
        "contradictory"    : contradictory,
        "abrupt_changes"   : abrupt_changes,
        "key_words"        : key_words,
        "negation_count"   : count_negations(text),
        "intensifier_count": count_intensifiers(text),
        "sentence_count"   : n,
        "emotions"         : emotions,
        "dominant_emotion" : dominant_emotion,
    }


def analyze_single_text(text: str) -> dict:
    """
    Análisis rápido de un texto sencillo.
    Retorna dict con compound_eq, pos, neg, neu, label.
    """
    try:
        analyzer = _get_sentiment_analyzer()
        pred = analyzer.predict(text)
        p_pos = pred.probas.get("POS", 0.0)
        p_neg = pred.probas.get("NEG", 0.0)
        p_neu = pred.probas.get("NEU", 0.0)
        c     = p_pos - p_neg
        return {"compound": round(c, 4), "pos": round(p_pos, 4),
                "neg": round(p_neg, 4), "neu": round(p_neu, 4)}
    except Exception:
        return {"compound": 0.0, "pos": 0.0, "neg": 0.0, "neu": 1.0}


# ─── Funciones privadas ───────────────────────────────────────────────────────

def _analyze_emotions(text: str) -> tuple[dict, str]:
    """
    Analiza emociones del texto completo usando el modelo de emociones.

    Retorna
    -------
    (emotions_dict, dominant_emotion_key)
    emotions_dict: {eng_label: probability, …}
    """
    emo_analyzer = _get_emotion_analyzer()
    if emo_analyzer is None:
        return {}, "others"
    try:
        pred = emo_analyzer.predict(text)
        probs = {k.lower(): round(v, 4) for k, v in pred.probas.items()}
        if probs:
            dominant = max(probs, key=probs.get)
        else:
            dominant = "others"
        return probs, dominant
    except Exception:
        return {}, "others"


def _sentence_label(compound: float) -> str:
    if compound >= 0.05:
        return "positiva"
    if compound <= -0.05:
        return "negativa"
    return "neutra"


def _classify(score: float) -> str:
    if score >= THRESHOLDS["Muy bueno"]:
        return "Muy bueno"
    if score >= THRESHOLDS["Bueno"]:
        return "Bueno"
    if score > THRESHOLDS["Regular"]:
        return "Regular"
    if score > THRESHOLDS["Malo"]:
        return "Malo"
    return "Muy malo"


def _count_abrupt_shifts(compounds: list[float]) -> int:
    if len(compounds) < 2:
        return 0
    return sum(
        1 for i in range(len(compounds) - 1)
        if abs(compounds[i + 1] - compounds[i]) > SHIFT_THRESHOLD
    )


def _empty_result() -> dict:
    return {
        "sentences"        : [],
        "compound_mean"    : 0.0,
        "compound_std"     : 0.0,
        "pos_ratio"        : 0.0,
        "neg_ratio"        : 0.0,
        "neu_ratio"        : 1.0,
        "intensity_max"    : 0.0,
        "mood_score"       : 0.0,
        "mood_label"       : "Regular",
        "emotional_var"    : 0.0,
        "contradictory"    : False,
        "abrupt_changes"   : 0,
        "key_words"        : {"positive": [], "negative": []},
        "negation_count"   : 0,
        "intensifier_count": 0,
        "sentence_count"   : 0,
        "emotions"         : {},
        "dominant_emotion" : "others",
    }


# ─── Colores y emojis por etiqueta (para UI) ─────────────────────────────────
MOOD_COLORS = {
    "Muy bueno": "#2ecc71",
    "Bueno":     "#27ae60",
    "Regular":   "#f39c12",
    "Malo":      "#e74c3c",
    "Muy malo":  "#8e1a0e",
}

MOOD_EMOJIS = {
    "Muy bueno": "🌟",
    "Bueno":     "😊",
    "Regular":   "😐",
    "Malo":      "😔",
    "Muy malo":  "😢",
}
