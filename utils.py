"""
utils.py — Utilidades compartidas para el Diario Personal Inteligente.

Incluye:
  - Formateo de fechas y duraciones
  - Paletas de colores y emojis para la UI
  - Funciones de presentación de resultados
  - Validación de texto de entrada
"""

from datetime import datetime


# ─── Colores y emojis (para Streamlit y matplotlib) ─────────────────────────

MOOD_COLORS = {
    "Muy bueno": "#10B981",  # Emerald green
    "Bueno":     "#34D399",  # Light green
    "Regular":   "#FBBF24",  # Amber
    "Malo":      "#FB923C",   # Orange
    "Muy malo":  "#F87171",   # Light red
}

MOOD_EMOJIS = {
    "Muy bueno": "🌟",
    "Bueno":     "😊",
    "Regular":   "😐",
    "Malo":      "😔",
    "Muy malo":  "😢",
}

# Gradiente para gráficas de compound (rojo → amarillo → verde)
COMPOUND_CMAP = "RdYlGn"

# Paleta discreta para barras de distribución
DISTRIBUTION_PALETTE = [
    MOOD_COLORS["Muy bueno"],
    MOOD_COLORS["Bueno"],
    MOOD_COLORS["Regular"],
    MOOD_COLORS["Malo"],
    MOOD_COLORS["Muy malo"],
]

# Orden canónico de etiquetas
MOOD_ORDER = ["Muy bueno", "Bueno", "Regular", "Malo", "Muy malo"]


# ─── Validación de entradas ───────────────────────────────────────────────────

MIN_WORDS = 3          # mínimo de palabras para aceptar entrada
MAX_CHARS = 10_000     # límite de caracteres

def validate_entry(text: str) -> tuple[bool, str]:
    """
    Valida el texto de una nueva entrada del diario.

    Retorna
    -------
    (True, "") si válido
    (False, mensaje_error) si inválido
    """
    text = text.strip()
    if not text:
        return False, "El texto no puede estar vacío."
    if len(text.split()) < MIN_WORDS:
        return False, f"Escribe al menos {MIN_WORDS} palabras."
    if len(text) > MAX_CHARS:
        return False, f"Máximo {MAX_CHARS:,} caracteres (actual: {len(text):,})."
    return True, ""


# ─── Formateo ─────────────────────────────────────────────────────────────────

def format_datetime(dt_str: str) -> str:
    """
    Convierte 'YYYY-MM-DD HH:MM:SS' a 'Lunes, 2 de Enero 2025 — 14:30'.
    """
    MONTHS_ES = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        day_name = DAYS_ES[dt.weekday()]
        month_name = MONTHS_ES[dt.month]
        return f"{day_name}, {dt.day} de {month_name} {dt.year} — {dt.strftime('%H:%M')}"
    except Exception:
        return dt_str


def format_compound(value: float) -> str:
    """Formatea compound score con signo y 3 decimales."""
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.3f}"


def format_score(value: float) -> str:
    """Formatea mood_score con signo y 3 decimales."""
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.3f}"


def compound_to_color(value: float) -> str:
    """
    Mapea un compound score ∈ [-1,1] a un color hexadecimal.

    Escala:
      -1.0 → rojo oscuro (#8e1a0e)
       0.0 → amarillo    (#f39c12)
      +1.0 → verde       (#2ecc71)

    Interpolación lineal en RGB.
    """
    # Normalizar a [0,1]
    t = (value + 1.0) / 2.0
    t = max(0.0, min(1.0, t))

    if t < 0.5:
        # Rojo → Amarillo
        r = int(142 + (243 - 142) * (t / 0.5))
        g = int(26  + (156 - 26)  * (t / 0.5))
        b = int(14  + (18  - 14)  * (t / 0.5))
    else:
        # Amarillo → Verde
        r = int(243 + (46  - 243) * ((t - 0.5) / 0.5))
        g = int(156 + (204 - 156) * ((t - 0.5) / 0.5))
        b = int(18  + (113 - 18)  * ((t - 0.5) / 0.5))

    return f"#{r:02x}{g:02x}{b:02x}"


def truncate_text(text: str, max_chars: int = 200) -> str:
    """Trunca el texto para mostrar en previews."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "…"


# ─── Helpers de estadísticas ──────────────────────────────────────────────────

def stability_label(ise: float) -> str:
    """Etiqueta descriptiva para el Índice de Estabilidad Emocional."""
    if ise >= 0.85:
        return "🧘 Muy estable"
    if ise >= 0.65:
        return "😌 Estable"
    if ise >= 0.45:
        return "😕 Variable"
    return "🌊 Muy variable"


def score_bar(score: float, width: int = 20) -> str:
    """
    Genera una barra de texto que representa el score ∈ [-1,1].
    Ejemplo: |─────── ● ──────────|
    """
    pos = int((score + 1.0) / 2.0 * width)
    pos = max(0, min(width, pos))
    bar = "─" * pos + "●" + "─" * (width - pos)
    return f"|{bar}|"
