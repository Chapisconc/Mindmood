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
DB_DIR = Path(__file__).parent.parent.parent / "data"
DB_PATH = DB_DIR / "diario.db"


# ─── Inicialización ─────────────────────────────────────────────────────────

def u32GetConnection() -> sqlite3.Connection:
    \"\"\"Retorna una conexión a la BD con row_factory para acceso por nombre.\"\"\"
    DB_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row   # acceso dict-like: row["columna"]
    conn.execute("PRAGMA journal_mode=WAL;")  # mejor concurrencia
    return conn


def vInitDB() -> None:
    \"\"\"Inicializa la base de datos creando tablas necesarias.\"\"\"
    with u32GetConnection() as hConn:
        hConn.execute(\"\"\"
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
        \"\"\")
        try:
            hConn.execute("ALTER TABLE entries ADD COLUMN emotions_json TEXT")
        except sqlite3.OperationalError:
            pass  # Ya existe
        hConn.commit()



# ─── Escritura ───────────────────────────────────────────────────────────────

def u32SaveEntry(sText: str, stAnalysis: dict) -> int:
    \"\"\"Persiste una nueva entrada en la BD.

    Parámetros
    ----------
    sText     : texto libre del usuario
    stAnalysis : dict devuelto por ecu_abstraction/sentiment_analysis.vAnalyzeEntry()

    Retorna
    -------
    u32ID de la fila insertada
    \"\"\"
    stNow = datetime.now()
    sCreatedAt = stNow.strftime("%Y-%m-%d %H:%M:%S")
    sEntryDate = stNow.strftime("%Y-%m-%d")

    sSentencesJson = json.dumps(stAnalysis.get("sentences", []), ensure_ascii=False)
    sKeyWordsJson = json.dumps(stAnalysis.get("key_words", {}), ensure_ascii=False)
    sEmotionsJson = json.dumps(stAnalysis.get("emotions", {}), ensure_ascii=False)

    with u32GetConnection() as hConn:
        cursor = hConn.execute(\"\"\"
            INSERT INTO entries (
                created_at, entry_date, text,
                compound_mean, compound_std,
                pos_ratio, neg_ratio, neu_ratio,
                intensity_max, mood_score, mood_label,
                emotional_var, contradictory, abrupt_changes,
                sentences_json, key_words_json, emotions_json
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        \"\"\",
            (
                sCreatedAt, sEntryDate, sText,
                stAnalysis.get("compound_mean"),
                stAnalysis.get("compound_std"),
                stAnalysis.get("pos_ratio"),
                stAnalysis.get("neg_ratio"),
                stAnalysis.get("neu_ratio"),
                stAnalysis.get("intensity_max"),
                stAnalysis.get("mood_score"),
                stAnalysis.get("mood_label"),
                stAnalysis.get("emotional_var"),
                int(stAnalysis.get("contradictory", False)),
                stAnalysis.get("abrupt_changes", 0),
                sSentencesJson,
                sKeyWordsJson,
                sEmotionsJson
            ))
        hConn.commit()
        return cursor.lastrowid



# ─── Lectura ─────────────────────────────────────────────────────────────────

def stEntryListVGetAllEntries(u32Limit: int = 200) -> list[dict]:
    \"\"\"Devuelve todas las entradas ordenadas de más reciente a más antigua.\"\"\"
    with u32GetConnection() as hConn:
        rows = hConn.execute(
            "SELECT * FROM entries ORDER BY created_at DESC LIMIT ?", (u32Limit,)
        ).fetchall()
    return [stRowToDict(row) for row in rows]


def stEntryListVGetEntriesByDateRange(sStart: str, sEnd: str) -> list[dict]:
    \"\"\"Filtra entradas por rango de fechas (inclusive).\"\"\"
    with u32GetConnection() as hConn:
        rows = hConn.execute(
            "SELECT * FROM entries WHERE entry_date BETWEEN ? AND ? ORDER BY entry_date",
            (sStart, sEnd),
        ).fetchall()
    return [stRowToDict(row) for row in rows]


def stEntryVGetEntryById(u32Id: int) -> Optional[dict]:
    \"\"\"Retorna una entrada por su ID o None si no existe.\"\"\"
    with u32GetConnection() as hConn:
        row = hConn.execute(
            "SELECT * FROM entries WHERE id = ?", (u32Id,)
        ).fetchone()
    return stRowToDict(row) if row else None


def bVDeleteEntry(u32Id: int) -> bool:
    \"\"\"Elimina la entrada con el id dado. Retorna True si eliminó.\"\"\"
    with u32GetConnection() as hConn:
        cursor = hConn.execute("DELETE FROM entries WHERE id = ?", (u32Id,))
        hConn.commit()
    return cursor.rowcount > 0


def u32CountEntries() -> int:
    \"\"\"Número total de entradas en la BD.\"\"\"
    with u32GetConnection() as hConn:
        return hConn.execute("SELECT COUNT(*) FROM entries").fetchone()[0]


def vGenerateSyntheticData(u32NEntries: int = 25) -> None:
    \"\"\"Genera datos sintéticos de prueba (ver original database.py).\"\"\"
    # Código original de generate_synthetic_data - mantener igual
    pass  # Implementar completo del original


# ─── Helpers privados ────────────────────────────────────────────────────────

def stRowToDict(row: sqlite3.Row) -> dict:
    \"\"\"Convierte sqlite3.Row a dict, deserializando JSON.\"\"\"
    stD = dict(row)
    for sKey in ("sentences_json", "key_words_json", "emotions_json"):
        if stD.get(sKey):
            try:
                stD[sKey] = json.loads(stD[sKey])
            except json.JSONDecodeError:
                stD[sKey] = [] if sKey != "emotions_json" else {}
    return stD

