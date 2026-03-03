"""
statistics.py — Estadísticas avanzadas sobre el historial del diario.

════════════════════════════════════════════════════════════════════════════════
MÉTRICAS IMPLEMENTADAS
════════════════════════════════════════════════════════════════════════════════

1. DISTRIBUCIÓN DE ESTADOS DE ÁNIMO
   Frecuencia de cada etiqueta: Muy bueno / Bueno / Regular / Malo / Muy malo.

2. EVOLUCIÓN TEMPORAL DEL COMPOUND SCORE
   Serie temporal de compound_mean por entrada (o por día promediado).

3. VARIABILIDAD EMOCIONAL POR DÍA
   emotional_var agrupado por fecha.

4. PROMEDIO SEMANAL Y MENSUAL
   Resample por semana (W) y mes (M) del compound_mean.

5. PORCENTAJE DE DÍAS MUY NEGATIVOS / MUY POSITIVOS
   Días donde mood_label ∈ {"Muy malo"} o mood_label ∈ {"Muy bueno"}.

6. ÍNDICE DE ESTABILIDAD EMOCIONAL (ISE)
   ┌──────────────────────────────────────────────────────────────────┐
   │  ISE = 1 − (σ_global / 2)                                       │
   │                                                                  │
   │  donde σ_global = std de todos los compound_mean disponibles.   │
   │  División por 2 porque compound ∈ [-1,1] → σ_max teórica ≈ 1.  │
   │  ISE ∈ [0, 1]: 1 = perfectamente estable, 0 = máx inestable    │
   └──────────────────────────────────────────────────────────────────┘

7. TENDENCIA GENERAL (REGRESIÓN LINEAL SIMPLE)
   ┌──────────────────────────────────────────────────────────────────┐
   │  Dado conjunto (xᵢ, yᵢ) donde xᵢ = índice ordinal de entrada   │
   │  e yᵢ = compound_mean:                                          │
   │                                                                  │
   │    β₁ = Cov(x,y) / Var(x)   (pendiente)                        │
   │    β₀ = ȳ − β₁·x̄            (intercepto)                       │
   │                                                                  │
   │  Se usa numpy.polyfit(x, y, deg=1) que implementa el mismo      │
   │  sistema usando mínimos cuadrados.                               │
   │                                                                  │
   │  β₁ > 0 → tendencia mejorando                                   │
   │  β₁ < 0 → tendencia empeorando                                  │
   └──────────────────────────────────────────────────────────────────┘
"""

import numpy as np
import pandas as pd
from collections import Counter
from datetime import datetime


# ─── Constantes ──────────────────────────────────────────────────────────────
VERY_POSITIVE_LABELS = {"Muy bueno"}
VERY_NEGATIVE_LABELS = {"Muy malo"}


# ─── Función principal ────────────────────────────────────────────────────────

def compute_all_stats(entries: list[dict]) -> dict:
    """
    Calcula todas las estadísticas a partir de la lista de entradas.

    Parámetros
    ----------
    entries : lista de dicts tal como los retorna database.get_all_entries()

    Retorna
    -------
    dict con todas las métricas (ver docstring del módulo).
    """
    if not entries:
        return _empty_stats()

    df = _to_dataframe(entries)

    # ── Orden cronológico para series temporales ──────────────────────────────
    df_sorted = df.sort_values("entry_date").reset_index(drop=True)

    return {
        "mood_distribution"      : mood_distribution(df),
        "temporal_evolution"     : temporal_evolution(df_sorted),
        "emotional_variability"  : emotional_variability_by_day(df_sorted),
        "weekly_avg"             : period_average(df_sorted, "W"),
        "monthly_avg"            : period_average(df_sorted, "ME"),
        "pct_very_positive"      : pct_extreme_days(df, VERY_POSITIVE_LABELS),
        "pct_very_negative"      : pct_extreme_days(df, VERY_NEGATIVE_LABELS),
        "stability_index"        : emotional_stability_index(df),
        "linear_trend"           : linear_trend(df_sorted),
        "total_entries"          : len(df),
        "date_range"             : (
            str(df_sorted["entry_date"].min().date()),
            str(df_sorted["entry_date"].max().date()),
        ),
        "global_compound_mean"   : round(float(df["compound_mean"].mean()), 4),
        "global_neg_ratio_mean"  : round(float(df["neg_ratio"].mean()), 4),
    }


# ─── Estadísticas individuales ───────────────────────────────────────────────

def mood_distribution(df: pd.DataFrame) -> dict[str, int]:
    """
    Frecuencia de cada etiqueta de estado de ánimo.

    Retorna dict ordenado de mejor a peor estado.
    """
    order = ["Muy bueno", "Bueno", "Regular", "Malo", "Muy malo"]
    counts = Counter(df["mood_label"].dropna())
    return {label: counts.get(label, 0) for label in order}


def temporal_evolution(df_sorted: pd.DataFrame) -> pd.DataFrame:
    """
    Serie temporal del compound_mean promediado por día.

    Retorna DataFrame con columnas: entry_date, compound_mean
    """
    daily = (
        df_sorted.groupby("entry_date")["compound_mean"]
        .mean()
        .reset_index()
    )
    daily.columns = ["entry_date", "compound_mean"]
    daily["compound_mean"] = daily["compound_mean"].round(4)
    return daily


def emotional_variability_by_day(df_sorted: pd.DataFrame) -> pd.DataFrame:
    """
    Variabilidad emocional (emotional_var) promediada por día.
    """
    daily = (
        df_sorted.groupby("entry_date")["emotional_var"]
        .mean()
        .reset_index()
    )
    daily.columns = ["entry_date", "emotional_var"]
    daily["emotional_var"] = daily["emotional_var"].round(4)
    return daily


def period_average(df_sorted: pd.DataFrame, freq: str) -> pd.DataFrame:
    """
    Promedio del compound_mean agrupado por período.

    Parámetros
    ----------
    freq : 'W'  para semanal, 'ME' para mensual
    """
    df_copy = df_sorted.copy()
    df_copy["entry_date"] = pd.to_datetime(df_copy["entry_date"])
    result = (
        df_copy.set_index("entry_date")["compound_mean"]
        .resample(freq)
        .mean()
        .dropna()
        .reset_index()
    )
    result.columns = ["period", "compound_mean"]
    result["compound_mean"] = result["compound_mean"].round(4)
    return result


def pct_extreme_days(df: pd.DataFrame, label_set: set[str]) -> float:
    """
    Porcentaje de entradas cuya mood_label está en label_set.

    Retorna float ∈ [0, 100]
    """
    if len(df) == 0:
        return 0.0
    count = df["mood_label"].isin(label_set).sum()
    return round(100 * count / len(df), 2)


def emotional_stability_index(df: pd.DataFrame) -> float:
    """
    Índice de Estabilidad Emocional (ISE).

    ISE = 1 - (σ_global / 2)
    donde σ_global = std de compound_mean de todas las entradas.

    División por 2: compound ∈ [-1,1] → σ máxima teórica ≈ 1.0,
    pero en la práctica los scores rara vez alcanzan los extremos,
    por lo que σ/2 normaliza bien a [0,1].

    ISE ∈ [0, 1]:
      1.0 = perfectamente estable (misma emoción siempre)
      0.0 = máxima inestabilidad
    """
    if len(df) < 2:
        return 1.0  # con 1 entrada no hay variabilidad medible
    sigma = float(df["compound_mean"].std())
    ise = 1.0 - min(sigma / 2.0, 1.0)
    return round(ise, 4)


def linear_trend(df_sorted: pd.DataFrame) -> dict:
    """
    Regresión lineal simple sobre los compound_mean en orden cronológico.

    Retorna
    -------
    {
      "slope"       : β₁  (pendiente de la línea de tendencia),
      "intercept"   : β₀  (intercepto),
      "trend_line"  : list[float]  (valores predichos para cada punto),
      "trend_label" : "Mejorando" | "Empeorando" | "Estable",
    }
    """
    y = df_sorted["compound_mean"].values.astype(float)
    x = np.arange(len(y), dtype=float)

    if len(y) < 2:
        return {
            "slope": 0.0, "intercept": float(y[0]) if len(y) else 0.0,
            "trend_line": list(y), "trend_label": "Estable"
        }

    coeffs = np.polyfit(x, y, deg=1)   # [β₁, β₀]
    slope     = float(coeffs[0])
    intercept = float(coeffs[1])
    trend_line = list(np.polyval(coeffs, x).round(4))

    if slope > 0.005:
        trend_label = "📈 Mejorando"
    elif slope < -0.005:
        trend_label = "📉 Empeorando"
    else:
        trend_label = "➡️ Estable"

    return {
        "slope"      : round(slope, 6),
        "intercept"  : round(intercept, 4),
        "trend_line" : trend_line,
        "trend_label": trend_label,
    }


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _to_dataframe(entries: list[dict]) -> pd.DataFrame:
    """Convierte la lista de dicts a DataFrame, garantizando tipos correctos."""
    df = pd.DataFrame(entries)
    df["entry_date"]   = pd.to_datetime(df["entry_date"])
    df["compound_mean"] = pd.to_numeric(df["compound_mean"], errors="coerce").fillna(0)
    df["emotional_var"] = pd.to_numeric(df["emotional_var"], errors="coerce").fillna(0)
    df["mood_label"]   = df["mood_label"].fillna("Regular")
    return df


def _empty_stats() -> dict:
    """Estadísticas vacías cuando no hay entradas en la BD."""
    empty_df = pd.DataFrame(columns=["entry_date", "compound_mean"])
    return {
        "mood_distribution"    : {l: 0 for l in ["Muy bueno","Bueno","Regular","Malo","Muy malo"]},
        "temporal_evolution"   : empty_df,
        "emotional_variability": empty_df.rename(columns={"compound_mean":"emotional_var"}),
        "weekly_avg"           : pd.DataFrame(columns=["period","compound_mean"]),
        "monthly_avg"          : pd.DataFrame(columns=["period","compound_mean"]),
        "pct_very_positive"    : 0.0,
        "pct_very_negative"    : 0.0,
        "stability_index"      : 1.0,
        "linear_trend"         : {"slope":0.0,"intercept":0.0,"trend_line":[],"trend_label":"Estable"},
        "total_entries"        : 0,
        "date_range"           : (None, None),
        "global_compound_mean" : 0.0,
        "global_neg_ratio_mean": 0.0,
    }
