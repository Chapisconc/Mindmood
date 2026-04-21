"""
database.py — Capa de persistencia SQLite para el Diario Personal Inteligente.

Responsabilidades:
  - Inicializar la base de datos y tablas.
  - Guardar entradas nuevas (texto + metadatos de sentimiento).
  - Consultar historial con filtros.
  - Eliminar entradas por ID.
"""

import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path
from cryptography.fernet import Fernet

# ─── Configuración ──────────────────────────────────────────────────────────
DB_DIR = Path(__file__).parent / "data"
DB_PATH = DB_DIR / "diario.db"


# ─── Inicialización ─────────────────────────────────────────────────────────

def get_connection() -> sqlite3.Connection:
    """Retorna una conexión a la BD con row_factory para acceso por nombre."""
    DB_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row   # acceso dict-like: row["columna"]
    conn.execute("PRAGMA journal_mode=WAL;")  # mejor concurrencia
    return conn


def init_db() -> None:
    """
    Crea la tabla `entries` si no existe.

    Columnas:
      id              INTEGER PK autoincrement
      created_at      TEXT    timestamp ISO-8601 (YYYY-MM-DD HH:MM:SS)
      entry_date      TEXT    fecha sólo (YYYY-MM-DD) — para agrupación diaria
      text            TEXT    cuerpo del diario
      compound_mean   REAL    promedio compound de oraciones
      compound_std    REAL    desviación estándar del compound
      pos_ratio       REAL    fracción de oraciones positivas
      neg_ratio       REAL    fracción de oraciones negativas
      neu_ratio       REAL    fracción de oraciones neutras
      intensity_max   REAL    valor absoluto máximo del compound en cualquier oración
      mood_score      REAL    puntuación propia (score en [-1,1])
      mood_label      TEXT    etiqueta: Muy bueno / Bueno / Regular / Malo / Muy malo
      emotional_var   REAL    variabilidad emocional (std / (|mean|+ε))
      contradictory   INTEGER bandera 0/1: texto contradictorio detectado
      abrupt_changes  INTEGER número de cambios bruscos emocionales detectados
      sentences_json  TEXT    JSON con análisis por oración
      key_words_json  TEXT    JSON {positivas:[...], negativas:[...]}
      emotions_json   TEXT    JSON de emociones {"joy": ..., "sadness": ...}
    """
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS entries (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at      TEXT    NOT NULL,
                entry_date      TEXT    NOT NULL,
                text            TEXT    NOT NULL,
                compound_mean   REAL,
                compound_std    REAL,
                pos_ratio       REAL,
                neg_ratio       REAL,
                neu_ratio       REAL,
                intensity_max   REAL,
                mood_score      REAL,
                mood_label      TEXT,
                emotional_var   REAL,
                contradictory   INTEGER DEFAULT 0,
                abrupt_changes  INTEGER DEFAULT 0,
                sentences_json  TEXT,
                key_words_json  TEXT
            )
        """)
        try:
            conn.execute("ALTER TABLE entries ADD COLUMN emotions_json TEXT")
        except sqlite3.OperationalError:
            pass  # Ya existe
        conn.commit()



# ─── Escritura ───────────────────────────────────────────────────────────────

def save_entry(text: str, analysis: dict) -> int:
    """
    Persiste una nueva entrada en la BD.

    Parámetros
    ----------
    text     : texto libre del usuario
    analysis : dict devuelto por sentiment_analysis.analyze_entry()

    Retorna
    -------
    id de la fila insertada
    """
    now = datetime.now()
    created_at = now.strftime("%Y-%m-%d %H:%M:%S")
    entry_date = now.strftime("%Y-%m-%d")

    sentences_json = json.dumps(analysis.get("sentences", []), ensure_ascii=False)
    key_words_json = json.dumps(analysis.get("key_words", {}), ensure_ascii=False)
    emotions_json = json.dumps(analysis.get("emotions", {}), ensure_ascii=False)

    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO entries (
                created_at, entry_date, text,
                compound_mean, compound_std,
                pos_ratio, neg_ratio, neu_ratio,
                intensity_max, mood_score, mood_label,
                emotional_var, contradictory, abrupt_changes,
                sentences_json, key_words_json, emotions_json
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            created_at, entry_date, text,
            analysis.get("compound_mean"),
            analysis.get("compound_std"),
            analysis.get("pos_ratio"),
            analysis.get("neg_ratio"),
            analysis.get("neu_ratio"),
            analysis.get("intensity_max"),
            analysis.get("mood_score"),
            analysis.get("mood_label"),
            analysis.get("emotional_var"),
            int(analysis.get("contradictory", False)),
            analysis.get("abrupt_changes", 0),
            sentences_json,
            key_words_json,
            emotions_json
        ))
        conn.commit()
        return cursor.lastrowid



# ─── Lectura ─────────────────────────────────────────────────────────────────

def get_all_entries(limit: int = 200) -> list[dict]:
    """
    Devuelve todas las entradas ordenadas de más reciente a más antigua.

    Parámetros
    ----------
    limit : número máximo de filas (default 200)
    """
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM entries ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_entries_by_date_range(start: str, end: str) -> list[dict]:
    """
    Filtra entradas por rango de fechas (inclusive).

    Parámetros
    ----------
    start : 'YYYY-MM-DD'
    end   : 'YYYY-MM-DD'
    """
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM entries WHERE entry_date BETWEEN ? AND ? ORDER BY entry_date",
            (start, end),
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_entry_by_id(entry_id: int) -> dict | None:
    """Retorna una entrada por su ID o None si no existe."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM entries WHERE id = ?", (entry_id,)
        ).fetchone()
    return _row_to_dict(row) if row else None


def delete_entry(entry_id: int) -> bool:
    """
    Elimina la entrada con el id dado.

    Retorna True si se eliminó, False si no existía.
    """
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
        conn.commit()
    return cursor.rowcount > 0


def count_entries() -> int:
    """Número total de entradas en la BD."""
    with get_connection() as conn:
        return conn.execute("SELECT COUNT(*) FROM entries").fetchone()[0]


def generate_synthetic_data(n_entries: int = 25) -> None:
    """
    Genera datos sintéticos de prueba para el diario.

    Crea entradas con variedad de estados emocionales distribuidos
    en los últimos 30 días para probar las visualizaciones.

    Parámetros
    ----------
    n_entries : número de entradas a generar (default 25)
    """
    import random
    from datetime import timedelta

    # Textos predefinidos por tipo de emoción
    TEXTS_BY_MOOD = {
        "Muy bueno": [
            "Hoy fue un día increíble. Logré terminar todos mis proyectos y me siento muy agradecido por el apoyo de mi familia.",
            "Excelente noticia: conseguí el trabajo que tanto buscaba. Estoy emocionado y listo para comenzar esta nueva etapa.",
            "Pasé un día maravilloso con amigos. La cena fue perfecta y las risas no faltaron. Me siento bendecido.",
            "Logré superar un reto difícil que me tenía preocupado. Ahora tengo confianza en mis abilities.",
            "Mi hijo hizo su primera presentación y lo hizo genial. Orgulloso de él.",
        ],
        "Bueno": [
            "Tuve un buen día en el trabajo. Completed todas mis tareas a tiempo.",
            "El clima estaba perfecto para caminar. Disfruté de un café mientras leía.",
            "Hice ejercicio esta mañana y me siento con más energía. Buenos hábitos.",
            "Conversé con un viejo amigo que no veía hace tiempo. Fue muy grato.",
            "Terminé de leer un libro interesante. Recomendaría su lectura.",
        ],
        "Regular": [
            "Día normal, sin nada especial. Trabajo routine y llegué a casa.",
            "Las cosas van como siempre. Nada extraordinario que mencionar.",
            "Un día平静. Sin mayores problemas pero tampoco alegrías grandes.",
            "Estuve ocupado con tareas del hogar. Nada fuera de lo común.",
            "El tráfico fue como siempre. another día típico en la ciudad.",
        ],
        "Malo": [
            "Tuve problemas en el trabajo que me tienen estresado. Ojalá se resuelvan pronto.",
            "No dormí bien y me siento agotado. Necesito descansar.",
            "Tuve una discusión con alguien cercano. Espero que podamos arreglarlo.",
            "Las cosas no salieran como esperaba. Frustrado con el resultado.",
            "Me siento un poco down hoy. Hopefully mañana será mejor.",
        ],
        "Muy malo": [
            "Fue un día terrible. Todo salió mal y no puedo más de la angustia.",
            "Recibí noticias muy tristes que me tienen devastado.",
            "El estrés me está consumiendo. Siento que nada tiene solución.",
            "Me siento completamente solo y sin esperanza. Duro día.",
            "Perdí algo muy importante para mí. No sé cómo recuperarme.",
        ],
    }

    # Distribución de estados emocionales (más datos en estados intermedios)
    MOOD_WEIGHTS = {
        "Muy bueno": 0.15,
        "Bueno": 0.30,
        "Regular": 0.25,
        "Malo": 0.20,
        "Muy malo": 0.10,
    }

    # Parámetros base para cada mood (compound, scores, etc.)
    MOOD_PARAMS = {
        "Muy bueno": {"compound_mean": 0.75, "compound_std": 0.15, "pos_ratio": 0.85, "neg_ratio": 0.05},
        "Bueno": {"compound_mean": 0.45, "compound_std": 0.20, "pos_ratio": 0.70, "neg_ratio": 0.10},
        "Regular": {"compound_mean": 0.05, "compound_std": 0.25, "pos_ratio": 0.35, "neg_ratio": 0.25},
        "Malo": {"compound_mean": -0.45, "compound_std": 0.20, "pos_ratio": 0.15, "neg_ratio": 0.65},
        "Muy malo": {"compound_mean": -0.75, "compound_std": 0.15, "pos_ratio": 0.05, "neg_ratio": 0.85},
    }

    def _generate_analysis(mood: str) -> dict:
        """Genera datos de análisis basados en el mood."""
        params = MOOD_PARAMS[mood]
        n_sentences = random.randint(2, 5)
        
        # Generar sentences
        sentences = []
        for i in range(n_sentences):
            compound = params["compound_mean"] + random.gauss(0, params["compound_std"])
            compound = max(-1, min(1, compound))
            
            if compound >= 0.05:
                label = "positiva"
                p_pos, p_neg = 0.6 + random.random() * 0.3, 0.1
            elif compound <= -0.05:
                label = "negativa"
                p_pos, p_neg = 0.1, 0.6 + random.random() * 0.3
            else:
                label = "neutra"
                p_pos, p_neg = 0.2, 0.2
            
            p_neu = 1.0 - p_pos - p_neg
            
            sentences.append({
                "text": f"Oración de ejemplo {i+1}",
                "compound": round(compound, 4),
                "pos": round(p_pos, 4),
                "neg": round(p_neg, 4),
                "neu": round(p_neu, 4),
                "label": label,
            })

        # Calcular estadísticas
        compounds = [s["compound"] for s in sentences]
        mu = sum(compounds) / len(compounds)
        sigma = (sum((c - mu) ** 2 for c in compounds) / len(compounds)) ** 0.5
        
        pos_count = sum(1 for c in compounds if c >= 0.05)
        neg_count = sum(1 for c in compounds if c <= -0.05)
        
        # Calcular mood_score (similar a sentiment_analysis)
        import math
        Im = max(abs(c) for c in compounds)
        sign_mu = math.copysign(1.0, mu) if mu != 0 else 0.0
        neg_ratio = neg_count / n_sentences
        emotional_var = sigma / (abs(mu) + 1e-6)
        
        W_MEAN = 0.50
        W_INTENSITY = 0.20
        W_NEG_RATIO = 0.20
        W_VARIAB = 0.10
        
        mood_score = (
            W_MEAN * mu
            + W_INTENSITY * Im * sign_mu
            - W_NEG_RATIO * neg_ratio
            - W_VARIAB * min(emotional_var, 1.0)
        )
        mood_score = max(-1.0, min(1.0, mood_score))

        # Emotions (dummy)
        emotions = {}
        if mood == "Muy bueno":
            emotions = {"joy": 0.75, "sadness": 0.05, "anger": 0.02, "fear": 0.01}
        elif mood == "Bueno":
            emotions = {"joy": 0.55, "sadness": 0.10, "anger": 0.05, "fear": 0.05}
        elif mood == "Regular":
            emotions = {"joy": 0.20, "sadness": 0.25, "anger": 0.15, "fear": 0.15}
        elif mood == "Malo":
            emotions = {"joy": 0.05, "sadness": 0.55, "anger": 0.25, "fear": 0.10}
        else:
            emotions = {"joy": 0.02, "sadness": 0.75, "anger": 0.15, "fear": 0.05}

        return {
            "sentences": sentences,
            "compound_mean": round(mu, 4),
            "compound_std": round(sigma, 4),
            "pos_ratio": round(pos_count / n_sentences, 4),
            "neg_ratio": round(neg_count / n_sentences, 4),
            "neu_ratio": round((n_sentences - pos_count - neg_count) / n_sentences, 4),
            "intensity_max": round(Im, 4),
            "mood_score": round(mood_score, 4),
            "mood_label": mood,
            "emotional_var": round(emotional_var, 4),
            "contradictory": params["pos_ratio"] > 0.3 and params["neg_ratio"] > 0.3,
            "abrupt_changes": random.randint(0, 2),
            "key_words": {"positive": [], "negative": []},
            "negation_count": random.randint(0, 3),
            "intensifier_count": random.randint(0, 2),
            "sentence_count": n_sentences,
            "emotions": emotions,
            "dominant_emotion": "joy" if mood in ["Muy bueno", "Bueno"] else "sadness",
        }

    # Generar las entradas
    now = datetime.now()
    entries_to_insert = []

    for i in range(n_entries):
        # Seleccionar mood aleatorio
        mood = random.choices(
            list(MOOD_WEIGHTS.keys()),
            weights=list(MOOD_WEIGHTS.values())
        )[0]

        # Seleccionar texto aleatorio del mood
        text = random.choice(TEXTS_BY_MOOD[mood])

        # Fecha aleatoria en los últimos 30 días
        days_ago = random.randint(0, 29)
        entry_date = now - timedelta(days=days_ago)
        created_at = entry_date.strftime("%Y-%m-%d %H:%M:%S")
        entry_date_str = entry_date.strftime("%Y-%m-%d")

        # Generar análisis
        analysis = _generate_analysis(mood)

        entries_to_insert.append((
            created_at, entry_date_str, text,
            analysis["compound_mean"], analysis["compound_std"],
            analysis["pos_ratio"], analysis["neg_ratio"], analysis["neu_ratio"],
            analysis["intensity_max"], analysis["mood_score"], analysis["mood_label"],
            analysis["emotional_var"], int(analysis["contradictory"]), analysis["abrupt_changes"],
            json.dumps(analysis["sentences"], ensure_ascii=False),
            json.dumps(analysis["key_words"], ensure_ascii=False),
            json.dumps(analysis["emotions"], ensure_ascii=False),
        ))

    # Insertar en la base de datos
    with get_connection() as conn:
        conn.executemany("""
            INSERT INTO entries (
                created_at, entry_date, text,
                compound_mean, compound_std,
                pos_ratio, neg_ratio, neu_ratio,
                intensity_max, mood_score, mood_label,
                emotional_var, contradictory, abrupt_changes,
                sentences_json, key_words_json, emotions_json
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, entries_to_insert)
        conn.commit()


# ─── Helpers privados ────────────────────────────────────────────────────────

def _row_to_dict(row: sqlite3.Row) -> dict:
    """Convierte un sqlite3.Row a dict, deserializando campos JSON."""
    d = dict(row)
    for key in ("sentences_json", "key_words_json", "emotions_json"):
        if d.get(key):
            try:
                d[key] = json.loads(d[key])
            except json.JSONDecodeError:
                d[key] = [] if key != "emotions_json" else {}
    return d
