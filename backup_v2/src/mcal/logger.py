"""
logger.py — Structured logging for Diario Inteligente
"""
import logging
from logging.handlers import RotatingFileHandler
import sys

def vSetupLogger():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('logs/diario.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger("diario_inteligente")

logger = vSetupLogger()

