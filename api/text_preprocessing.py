import re
import emoji
import json
from functools import lru_cache
from deep_translator import GoogleTranslator
from typing import Dict

# Load Mexican slang dataset
def load_mexican_slang():
    try:
        with open('ai_api/mexican_slang_dataset.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: mexican_slang_dataset.json not found. Using empty dict.")
        return {}

SLANG_DICT = load_mexican_slang()
translator = GoogleTranslator(source='es', target='en')

@lru_cache(maxsize=1000)
def translate_text(text: str) -> str:
    if not text.strip():
        return ''
    try:
        return translator.translate(text)
    except Exception:
        return text

def preprocess_text(text: str, normalize_slang=True, translate=True, remove_noise=True) -> str:
    """
    VADER-friendly preprocessing for Spanish text:
    - Remove emojis
    - Normalize Mexican slang
    - Remove noise (URLs, mentions, extra whitespace)
    - Optional translation to English for VADER
    """
    # Step 1: Remove emojis
    text = emoji.replace_emoji(text, replace='')

    # Step 2: Normalize slang
    if normalize_slang:
        for slang, replacement in SLANG_DICT.items():
            text = re.sub(r'\b' + re.escape(slang) + r'\b', replacement, text, flags=re.IGNORECASE)

    # Step 3: Remove noise
    if remove_noise:
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)  # URLs
        text = re.sub(r'@[A-Za-z0-9_]+', '', text)  # Mentions
        text = re.sub(r'#[A-Za-z0-9_]+', '', text)  # Hashtags
        text = re.sub(r'\s+', ' ', text).strip()  # Extra whitespace

    # Step 4: Translate for VADER
    if translate:
        text = translate_text(text)

    return text

# Example usage
if __name__ == '__main__':
    sample = 'Hoy estoy super aguitado 😢 no manches que chafa!'
    processed = preprocess_text(sample)
    print('Original:', sample)
    print('Processed:', processed)

