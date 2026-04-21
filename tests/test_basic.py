import pytest
from app.services.sentiment_service import sentiment_service
from infrastructure.database.repository import fnInitDb, fnSaveEntry, fnGetAllEntries, fnCountEntries, fnGenerateSyntheticData
import sqlite3

def test_sentiment_analysis_basic():
    text_pos = "Me siento muy feliz hoy, todo fue alucinante."
    res_pos = sentiment_service.analyze_text(text_pos)
    assert res_pos['fScore'] > 0
    assert res_pos['sLabel'] in ['Positivo', 'Muy positivo']
    
    text_neg = "Esto fue un completo desastre, odio este día."
    res_neg = sentiment_service.analyze_text(text_neg)
    assert res_neg['fScore'] < 0
    assert res_neg['sLabel'] in ['Negativo', 'Muy negativo']
    
def test_sentiment_negations():
    # VADER should catch negations if translated correctly
    text = "No me gusta absolutamente nada esto."
    res = sentiment_service.analyze_text(text)
    assert res['stats']['negations'] > 0
    
def test_database_persistence():
    fnInitDb()
    initial_count = fnCountEntries()
    
    analysis = sentiment_service.analyze_text("Texto de prueba")
    fnSaveEntry("Texto de prueba", analysis)
    
    new_count = fnCountEntries()
    assert new_count == initial_count + 1
    
    entries = fnGetAllEntries(1)
    assert entries[0]['text'] == "Texto de prueba"
    assert entries[0]['mood_label'] == analysis['mood_label']
