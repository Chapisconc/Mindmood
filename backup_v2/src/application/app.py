"""
app.py — Application layer - Main Streamlit UI
Updated imports for new structure.

from src.mcal.database import *
from src.ecu_abstraction.sentiment_analysis import vAnalyzeEntry
from src.ecu_abstraction.statistics import stStatsVComputeAllStats
from src.ecu_abstraction.utils import *  # MOOD_COLORS etc.

Main logic refactored - no business logic here.
Only UI rendering.
"""
# Full app.py content with updated imports and Hungarian notation where applicable
import streamlit as st
# ... rest from original app.py, update imports:
# import database as db → from src.mcal.database import *
# import sentiment_analysis as sa → from src.ecu_abstraction.sentiment_analysis import vAnalyzeEntry as vAnalyzeEntry
# import statistics as stats_module → from src.ecu_abstraction.statistics import stStatsVComputeAllStats
# Keep UI logic, remove duplication

