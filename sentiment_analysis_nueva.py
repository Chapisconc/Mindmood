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
   │  compound_eq = P(POS) − P(NEG) * fConfidence    ∈ [−1, 1] │
   │                                                          │
   │  fConfidence = 1.0 - P(NEU)                             │
   └──────────────────────────────────────────────────────────┘

3. DETECCIÓN DE EMOCIONES POR ORACIÓN (ponderado)
   Promedio ponderado de emociones por oración, peso = |compound|.

════════════════════════════════════════════════════════════════════════════════
9 CAMBIOS APLICADOS ✅
════════════════════════════════════════════════════════════════════════════════
1. Cache @st.cache_resource
2. Timeout ThreadPoolExecutor (1.2s)
3. MIN_SENTENCE_WORDS = 3
4. lru_cache eliminado
5. Notación húngara + aliases
6. Compound ponderado fConfidence
7. Factor confianza n/10.0
8. Doble negación adjustment
9. Emociones por oración ponderadas
"""

import math
import numpy as np
import streamlit as st
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor, TimeoutError, as_completed
from typing import Dict, List, Optional, Tuple

from pysentimiento import create_analyzer

from text_processing import (
    split_into_sentences,
    extract_emotional_keywords,
    count_negations,
    count_intensifiers,
)

# ─── Constantes ───────────────────────────────────────────────────────────────
MIN_SENTENCE_WORDS = 3
TIMEOUT_SECONDS = 1.2
SHIFT_THRESHOLD = 0.5
CONTRADICTION_MIN = 0.25
EPSILON = 1e-6

W_MEAN = 0.50
W_INTENSITY = 0.20
W_NEG_RATIO = 0.20
W_VARIAB = 0.10

THRESHOLDS = {
    "Muy bueno":  0.50,
    "Bueno":      0.10,
    "Regular":   -0.10,
    "Malo":      -0.50,
}

# [CONSTANTES NO MODIFICADAS - EMOTION_LABELS_ES, EMOTION_EMOJIS, EMOTION_COLORS, MOOD_COLORS, MOOD_EMOJIS]
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

# ─── Modelos cached ──────────────────────────────────────────────────────────
@st.cache_resource
def _get_sentiment_analyzer() -> 'Analyzer':
    """Sentiment analyzer cached."""
    return create_analyzer(task="sentiment", lang="es")

@st.cache_resource
def _get_emotion_analyzer() -> Optional['Analyzer']:
    """Emotion analyzer cached (optional)."""
    try:
        return create_analyzer(task="emotion", lang="es")
    except Exception:
        return None

# ─── Timeout prediction ──────────────────────────────────────────────────────
def _predict_with_timeout(analyzer: 'Analyzer', strText: str, fTimeout: float = 1.2) -> Optional[dict]:
    """Ejecuta predictor con timeout, retorna None si excede tiempo."""
    def fnPredict():
        pred = analyzer.predict(strText)
        p_pos = pred.probas.get("POS", 0.0)
        p_neg = pred.probas.get("NEG", 0.0)
        p_neu = pred.probas.get("NEU", 0.0)
        fConfidence = 1.0 - p_neu
        fCompound = (p_pos - p_neg) * fConfidence
        return {"p_pos": p_pos, "p_neg": p_neg, "p_neu": p_neu, "compound": fCompound}
    
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(fnPredict)
        try:
            return future.result(timeout=fTimeout)
        except TimeoutError:
            return None

def _predict_emotions_with_timeout(analyzer: Optional['Analyzer'], strText: str, fTimeout: float = 1.2) -> Dict[str, float]:
    """Predicción de emociones con timeout."""
    if not analyzer:
        return {}
    def fnPredictEmo():
        pred = analyzer.predict(strText)
        return {k.lower(): v for k, v in pred.probas.items()}
    
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(fnPredictEmo)
        try:
            return future.result(timeout=fTimeout)
        except TimeoutError:
            return {}

# ─── API Pública (Notación Húngara) ─────────────────────────────────────────
def fnAnalyzeEntry(strText: str) -> dict:
    """Análisis completo entrada diario (versión optimizada)."""
    sentences_raw = split_into_sentences(strText)
    sentences = [s for s in sentences_raw if len(s.split()) >= MIN_SENTENCE_WORDS]
    if not sentences:
        return _empty_result()

    sent_analyzer = _get_sentiment_analyzer()
    emo_analyzer = _get_emotion_analyzer()

    # Análisis por oración con timeout
    sentence_results = []
    compounds = []
    all_emotions = []  # Para promediado ponderado

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(_predict_with_timeout, sent_analyzer, sent) for sent in sentences]
        for i, future in enumerate(as_completed(futures)):
            sent = sentences[i]
            result = future.result()
            if result:
                p_pos, p_neg, p_neu, c = result["p_pos"], result["p_neg"], result["p_neu"], result["compound"]
                sent_emotions = _predict_emotions_with_timeout(emo_analyzer, sent)
            else:
                # Fallback timeout
                p_pos, p_neg, p_neu, c, sent_emotions = 0.0, 0.0, 1.0, 0.0, {}
            
            compounds.append(c)
            sentence_results.append({
                "text": sent,
                "compound": round(c, 4),
                "pos": round(p_pos, 4),
                "neg": round(p_neg, 4),
                "neu": round(p_neu, 4),
                "label": _sentence_label(c),
                "emotions": sent_emotions
            })
            if sent_emotions:
                all_emotions.append((abs(c), sent_emotions))

    n = len(compounds)

    # Estadísticas agregadas
    arr = np.array(compounds, dtype=float)
    mu = float(np.mean(arr))
    sigma = float(np.std(arr))
    Im = float(np.max(np.abs(arr)))

    pos_count = sum(1 for c in compounds if c >= 0.05)
    neg_count = sum(1 for c in compounds if c <= -0.05)
    neu_count = n - pos_count - neg_count

    pos_ratio = pos_count / n
    neg_ratio = neg_count / n
    neu_ratio = neu_count / n

    emotional_var = sigma / (abs(mu) + EPSILON)

    # Puntuación propia
    sign_mu = math.copysign(1.0, mu) if mu != 0 else 0.0
    mood_score = (
        W_MEAN * mu
        + W_INTENSITY * Im * sign_mu
        - W_NEG_RATIO * neg_ratio
        - W_VARIAB * min(emotional_var, 1.0)
    )
    mood_score = max(-1.0, min(1.0, mood_score))

    # Factor confianza
    fConfidenceFactor = min(n / 10.0, 1.0)
    mood_score = mood_score * fConfidenceFactor + mu * (1.0 - fConfidenceFactor)
    mood_score = max(-1.0, min(1.0, mood_score))

    # Doble negación
    nNegations = count_negations(strText)
    if nNegations >= 2 and mood_score < -0.1:
        mood_score = mood_score * 0.6
        mood_score = max(-1.0, min(1.0, mood_score))

    mood_label = _classify(mood_score)

    abrupt_changes = _count_abrupt_shifts(compounds)
    contradictory = (pos_ratio > CONTRADICTION_MIN and neg_ratio > CONTRADICTION_MIN)

    key_words = extract_emotional_keywords(strText)

    # Emociones promediadas por oración (ponderado |compound|)
    emotions = _average_sentence_emotions(all_emotions)

    dominant_emotion = max(emotions, key=emotions.get) if emotions else "others"

    return {
        "sentences": sentence_results,
        "compound_mean": round(mu, 4),
        "compound_std": round(sigma, 4),
        "pos_ratio": round(pos_ratio, 4),
        "neg_ratio": round(neg_ratio, 4),
        "neu_ratio": round(neu_ratio, 4),
        "intensity_max": round(Im, 4),
        "mood_score": round(mood_score, 4),
        "mood_label": mood_label,
        "emotional_var": round(emotional_var, 4),
        "contradictory": contradictory,
        "abrupt_changes": abrupt_changes,
        "key_words": key_words,
        "negation_count": nNegations,
        "intensifier_count": count_intensifiers(strText),
        "sentence_count": n,
        "emotions": emotions,
        "dominant_emotion": dominant_emotion,
    }

def fnAnalyzeSingleText(strText: str) -> dict:
    """Análisis rápido texto simple con timeout."""
    sent_analyzer = _get_sentiment_analyzer()
    result = _predict_with_timeout(sent_analyzer, strText)
    if result:
        return {
            "compound": round(result["compound"], 4),
            "pos": round(result["p_pos"], 4),
            "neg": round(result["p_neg"], 4),
            "neu": round(result["p_neu"], 4)
        }
    return {"compound": 0.0, "pos": 0.0, "neg": 0.0, "neu": 1.0}

# Aliases para compatibilidad
analyze_entry = fnAnalyzeEntry
analyze_single_text = fnAnalyzeSingleText

# [RESTA FUNCIONES PRIVADAS sin cambios: _analyze_emotions, _sentence_label, _classify, _count_abrupt_shifts, _empty_result]
def _average_sentence_emotions(all_emotions: List[Tuple[float, Dict]]) -> Dict[str, float]:
    """Promedia emociones ponderado por |compound|."""
    if not all_emotions:
        return {}
    
    emotion_keys = set()
    for _, emos in all_emotions:
        emotion_keys.update(emos.keys())
    
    avg_emotions = {}
    total_weight = 0.0
    
    for emo_key in emotion_keys:
        weighted_sum = 0.0
        for weight, emos in all_emotions:
            weighted_sum += weight * emos.get(emo_key, 0.0)
            total_weight += weight
        avg_emotions[emo_key] = weighted_sum / total_weight if total_weight > 0 else 0.0
    
    return {k: round(v, 4) for k, v in avg_emotions.items()}

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
    return sum(1 for i in range(len(compounds) - 1) if abs(compounds[i + 1] - compounds[i]) > SHIFT_THRESHOLD)

def _empty_result() -> dict:
    return {
        "sentences": [],
        "compound_mean": 0.0,
        "compound_std": 0.0,
        "pos_ratio": 0.0,
        "neg_ratio": 0.0,
        "neu_ratio": 1.0,
        "intensity_max": 0.0,
        "mood_score": 0.0,
        "mood_label": "Regular",
        "emotional_var": 0.0,
        "contradictory": False,
        "abrupt_changes": 0,
        "key_words": {"positive": [], "negative": []},
        "negation_count": 0,
        "intensifier_count": 0,
        "sentence_count": 0,
        "emotions": {},
        "dominant_emotion": "others",
    }
