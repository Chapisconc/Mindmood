"""
config.py — MCAL Configuration Manager

Centralized configuration with YAML + env vars.
"""
import os
from typing import Dict, Any
import yaml

class stConfig:
    def __init__(self):
        self.sDbPath = os.getenv("DB_PATH", "data/diario.db")
        self.bDebug = os.getenv("DEBUG", "false").lower() == "true"
        # Load YAML
        with open("config/settings.yaml", "r") as f:
            self.stSettings = yaml.safe_load(f)

config = stConfig()

