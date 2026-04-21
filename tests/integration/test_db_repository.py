"""
test_db_repository.py — Integration tests for db_repository.
"""
import pytest
import os
from pathlib import Path
from src.mcal.db_repository import (
    fnInitDb, fnGetConnection, fnSaveEntry, fnGetAllEntries, fnCountEntries, fnDeleteEntry
)
from src.mcal.config_manager import objConfigManager

@pytest.fixture(autouse=True)
def setup_db(tmp_path):
    """Sobreescribe la BD a un temp dir para tests."""
    objOldDbPath = objConfigManager.strDbPath
    objConfigManager.strDbPath = str(tmp_path / "test_diario.db")
    fnInitDb()
    yield
    objConfigManager.strDbPath = objOldDbPath

def test_save_and_getAllEntries():
    dictAnalysis = {
        "compound_mean": 0.5, "mood_label": "Bueno",
        "sentences": [{"text": "Hola", "label": "positiva"}]
    }
    nId = fnSaveEntry("Hola mundo", dictAnalysis)
    assert nId > 0
    
    lstEntries = fnGetAllEntries()
    assert len(lstEntries) == 1
    assert lstEntries[0]["text"] == "Hola mundo"
    assert lstEntries[0]["mood_label"] == "Bueno"

def test_delete_entry():
    nId = fnSaveEntry("Borrar", {})
    assert fnCountEntries() == 1
    
    bDeleted = fnDeleteEntry(nId)
    assert bDeleted is True
    assert fnCountEntries() == 0
