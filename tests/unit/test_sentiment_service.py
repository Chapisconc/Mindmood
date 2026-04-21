"""
test_sentiment_service.py — Unit tests for CSentimentService.
"""
import pytest
from src.ecu_abstraction.sentiment_service import objSentimentService

def test_clean_text():
    strRaw = "Hola   mundo!!! :smile: xq tmb quiero"
    strClean = objSentimentService._fnCleanText(strRaw)
    # :smile: usually maps to something like 😄 or directly translated to text.
    # emojis are handled by demojize initially. We just assert abreviations and spaces.
    assert "porque" in strClean.lower()
    assert "también" in strClean.lower()
    assert "   " not in strClean

def test_count_negations():
    strText = "No quiero decir nada a nadie."
    assert objSentimentService._fnCountNegations(strText) == 3

def test_count_intensifiers():
    strText = "Esto es súper muy extremadamente bueno."
    assert objSentimentService._fnCountIntensifiers(strText) == 3

def test_segment_sentences():
    lstSent = objSentimentService._fnSegmentSentences("Hola. ¿Qué tal? Adiós!")
    assert len(lstSent) >= 2
    assert lstSent[0] == "Hola."
