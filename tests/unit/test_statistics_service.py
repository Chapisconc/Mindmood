"""
test_statistics_service.py — Unit tests for CStatisticsService.
"""
import pytest
from src.ecu_abstraction.statistics_service import objStatisticsService

def test_empty_stats():
    dictStats = objStatisticsService.fnComputeAllStats([])
    assert dictStats["total_entries"] == 0
    assert dictStats["global_compound_mean"] == 0.0

def test_stats_with_data():
    lstEntries = [
        {"entry_date": "2023-01-01 12:00:00", "compound_mean": 0.5, "emotional_var": 0.1, "mood_label": "Bueno", "neg_ratio": 0.0},
        {"entry_date": "2023-01-02 12:00:00", "compound_mean": -0.5, "emotional_var": 0.2, "mood_label": "Malo", "neg_ratio": 0.5},
    ]
    dictStats = objStatisticsService.fnComputeAllStats(lstEntries)
    
    assert dictStats["total_entries"] == 2
    assert dictStats["global_compound_mean"] == 0.0
    assert dictStats["mood_distribution"]["Bueno"] == 1
    assert dictStats["mood_distribution"]["Malo"] == 1
    assert dictStats["mood_distribution"]["Regular"] == 0
