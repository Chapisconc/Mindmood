"""
text_preprocessing.py — Preprocesamiento avanzado para Diario Inteligente
"""
import re
import emoji
from typing import List

def fnPreprocessText(strText: str) -> str:
    """Preprocesa texto para análisis NLP."""
    # 1. Emojis a texto español
    strText = emoji.demojize(strText, language='es')
    
    # 2. Normalizar abreviaciones \b word boundaries
    dictAbrev = {
        r'\btmb\b|\btb\b': 'también',
        r'\bxq\b|\bpq\b': 'porque',
        r'\bq\b|\bk\b': 'que',
        r'\bxfa\b': 'por favor',
        r'\bjaja\b|jiji\b|jeje\b': 'gracioso',
        r'\bntp\b': 'no te preocupes',
    }
    for pattern, repl in dictAbrev.items():
        strText = re.sub(pattern, repl, strText, flags=re.IGNORECASE)
    
    # 3. Eliminar caracteres repetidos excesivos
    strText = re.sub(r'(.)\1{2,}', r'\1\1', strText)
    
    # 4. Separar emojis pegados (simplificado)
    strText = re.sub(r'([a-zA-Z])(\:[a-z]+\:)([a-zA-Z])', r'\1 \2 \3', strText)
    
    # 5. Espacios múltiples → single + strip
    strText = re.sub(r'\s+', ' ', strText).strip()
    
    return strText

