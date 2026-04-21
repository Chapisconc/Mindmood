'''
text_processing.py — Procesamiento de texto para Diario Inteligente
'''
import re
from typing import List

def split_into_sentences(text: str) -> List[str]:
    '''Divide texto en oraciones usando regex español.'''
    # Regex simple para español: .?! seguido de espacio/mayúscula
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s', text)
    return [s.strip() for s in sentences if s.strip()]

def extract_emotional_keywords(text: str) -> dict:
    '''Extrae keywords emocionales (stub).'''
    return {'positive': [], 'negative': []}

def count_negations(text: str) -> int:
    '''Cuenta negaciones (no, nunca, nada, nadie...).'''
    neg_words = ['no', 'nunca', 'nada', 'nadie', 'ni', 'jamás', 'tampoco']
    words = re.findall(r'\b\w+\b', text.lower())
    return sum(1 for word in words if word in neg_words)

def count_intensifiers(text: str) -> int:
    '''Cuenta intensificadores (muy, super, totalmente...).'''
    intens = ['muy', 'super', 'totalmente', 'completamente', 'extremadamente']
    words = re.findall(r'\b\w+\b', text.lower())
    return sum(1 for word in words if word in intens)

