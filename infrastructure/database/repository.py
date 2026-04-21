import sqlite3
import json
from datetime import datetime
from config.settings import DB_PATH

def fnGetConnection() -> sqlite3.Connection:
    """Retorna una conexión a la BD."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    objConn = sqlite3.connect(str(DB_PATH))
    objConn.row_factory = sqlite3.Row
    objConn.execute("PRAGMA journal_mode=WAL;")
    return objConn

def fnInitDb() -> None:
    """Crea la tabla `entries` si no existe."""
    with fnGetConnection() as objConn:
        objConn.execute("""
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
                key_words_json  TEXT,
                emotions_json   TEXT
            )
        """)
        objConn.commit()

def fnSaveEntry(strText: str, dictAnalysis: dict) -> int:
    """Persiste una nueva entrada en la BD."""
    objNow = datetime.now()
    strCreatedAt = objNow.strftime("%Y-%m-%d %H:%M:%S")
    strEntryDate = objNow.strftime("%Y-%m-%d")

    strSentencesJson = json.dumps(dictAnalysis.get("sentences", []), ensure_ascii=False)
    strKeyWordsJson = json.dumps(dictAnalysis.get("key_words", {}), ensure_ascii=False)
    strEmotionsJson = json.dumps(dictAnalysis.get("tags", []), ensure_ascii=False)

    with fnGetConnection() as objConn:
        objCursor = objConn.execute("""
            INSERT INTO entries (
                created_at, entry_date, text,
                compound_mean, compound_std,
                pos_ratio, neg_ratio, neu_ratio,
                intensity_max, mood_score, mood_label,
                emotional_var, contradictory, abrupt_changes,
                sentences_json, key_words_json, emotions_json
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            strCreatedAt, strEntryDate, strText,
            dictAnalysis.get("compound_mean"),
            dictAnalysis.get("compound_std"),
            dictAnalysis.get("pos_ratio"),
            dictAnalysis.get("neg_ratio"),
            dictAnalysis.get("neu_ratio"),
            dictAnalysis.get("intensity_max"),
            dictAnalysis.get("mood_score"),
            dictAnalysis.get("mood_label"),
            dictAnalysis.get("emotional_var"),
            int(dictAnalysis.get("contradictory", False)),
            dictAnalysis.get("abrupt_changes", 0),
            strSentencesJson,
            strKeyWordsJson,
            strEmotionsJson
        ))
        objConn.commit()
        return objCursor.lastrowid

def fnGetAllEntries(nLimit: int = 1000) -> list[dict]:
    """Devuelve entradas ordenadas."""
    with fnGetConnection() as objConn:
        lstRows = objConn.execute(
            "SELECT * FROM entries ORDER BY created_at DESC LIMIT ?", (nLimit,)
        ).fetchall()
    return [_fnRowToDict(r) for r in lstRows]

def fnGetEntriesByDateRange(strStart: str, strEnd: str) -> list[dict]:
    """Filtra entradas por rango de fechas."""
    with fnGetConnection() as objConn:
        lstRows = objConn.execute(
            "SELECT * FROM entries WHERE entry_date BETWEEN ? AND ? ORDER BY entry_date",
            (strStart, strEnd),
        ).fetchall()
    return [_fnRowToDict(r) for r in lstRows]

def fnGetEntryById(nEntryId: int) -> dict | None:
    """Retorna una entrada por su ID."""
    with fnGetConnection() as objConn:
        objRow = objConn.execute(
            "SELECT * FROM entries WHERE id = ?", (nEntryId,)
        ).fetchone()
    return _fnRowToDict(objRow) if objRow else None

def fnDeleteEntry(nEntryId: int) -> bool:
    """Elimina la entrada con el id dado."""
    with fnGetConnection() as objConn:
        objCursor = objConn.execute("DELETE FROM entries WHERE id = ?", (nEntryId,))
        objConn.commit()
    return objCursor.rowcount > 0

def fnCountEntries() -> int:
    """Número total de entradas en la BD."""
    with fnGetConnection() as objConn:
        return objConn.execute("SELECT COUNT(*) FROM entries").fetchone()[0]

def _fnRowToDict(objRow: sqlite3.Row) -> dict:
    """Convierte un sqlite3.Row a dict."""
    dictRow = dict(objRow)
    for strKey in ("sentences_json", "key_words_json", "emotions_json"):
        if dictRow.get(strKey):
            try:
                dictRow[strKey] = json.loads(dictRow[strKey])
            except json.JSONDecodeError:
                dictRow[strKey] = [] if strKey != "emotions_json" else {}
    return dictRow

def fnGenerateSyntheticData(nEntries: int = 10) -> None:
    import random
    from datetime import timedelta
    
    lstMoods = ["Muy positivo", "Positivo", "Neutro", "Negativo", "Muy negativo"]
    lstTexts = [
        "Hoy tuve un gran día, logré todos mis objetivos.",
        "Un día tranquilo, sin muchas novedades.",
        "Me siento un poco estresado por el trabajo.",
        "Día productivo, aprendí cosas nuevas.",
        "Me siento triste por una mala noticia."
    ]
    
    objNow = datetime.now()
    for _ in range(nEntries):
        strMood = random.choice(lstMoods)
        strText = random.choice(lstTexts)
        nDaysAgo = random.randint(0, 30)
        objEntryDate = objNow - timedelta(days=nDaysAgo)
        
        fCompound = random.uniform(-1, 1)
        if strMood == "Muy positivo": fCompound = random.uniform(0.6, 1)
        elif strMood == "Positivo": fCompound = random.uniform(0.1, 0.6)
        elif strMood == "Negativo": fCompound = random.uniform(-0.6, -0.1)
        elif strMood == "Muy negativo": fCompound = random.uniform(-1, -0.6)
        
        dictAnalysis = {
            "compound_mean": fCompound,
            "compound_std": random.uniform(0, 0.5),
            "pos_ratio": max(0, fCompound),
            "neg_ratio": abs(min(0, fCompound)),
            "neu_ratio": 0.2,
            "intensity_max": abs(fCompound),
            "mood_score": fCompound,
            "mood_label": strMood,
            "emotional_var": random.uniform(0, 1),
            "contradictory": False,
            "abrupt_changes": 0,
            "tags": [],
            "sentences": [{"text": strText, "compound": fCompound}]
        }
        
        nId = fnSaveEntry(strText, dictAnalysis)
        strCreatedAt = objEntryDate.strftime("%Y-%m-%d %H:%M:%S")
        strEntryDateStr = objEntryDate.strftime("%Y-%m-%d")
        with fnGetConnection() as objConn:
            objConn.execute("UPDATE entries SET created_at = ?, entry_date = ? WHERE id = ?", (strCreatedAt, strEntryDateStr, nId))
            objConn.commit()
