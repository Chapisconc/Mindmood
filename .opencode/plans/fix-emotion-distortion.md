# Fix: Emotion Classification Noise

## Problem
"me siento a toda madre" detects Triste + 3-4 other emotions despite positive text.

## Root Causes

### 1. `emotions_distribution` returns ALL emotions from model
`main.py:719` sends the full `distribution` dict. Frontend renders every entry as sub-emotion bubble. Even after filters, low-percentage emotions like Sorpresa(11%) or Neutral(3%) appear visually.

### 2. Polarity threshold too high (> 0.5)
If compound is 0.3-0.5, polarity filter is completely skipped.

### 3. Keyword substring matching
`any(kw in text_no_accents for kw in keywords)` uses substring match, not word boundaries.

### 4. Pipeline order: keyword reinforcement runs BEFORE polarity filter
Keywords inject noise emotions at 30% floor, then polarity filter has to clean up.

### 5. JSON encoding corruption
`mexican_slang_dataset.json`: "fantástico" → "fantǭstico" — model receives garbled text.

## Fixes (5)

### Fix 1: Filter distribution to detected_moods before API response
**File:** `ai_api/main.py`, after line 714
```python
# Filtrar distribución para que solo incluya emociones detectadas
distribution = {k: v for k, v in distribution.items() if k in detected_moods}
```

### Fix 2: Lower polarity threshold 0.5 → 0.3
**File:** `ai_api/main.py`
```python
# Line 624
if compound > 0.3:
# Line 631
elif compound < -0.3:
```

### Fix 3: Reorder pipeline — polarity filter BEFORE keyword reinforcement
**File:** `ai_api/main.py`
Move the polarity filter block (lines 622-636) ABOVE the keyword reinforcement block (lines 613-620).

### Fix 4: Word boundaries in keyword matching
**File:** `ai_api/main.py`, line 616
```python
for category, keywords in EMOTION_KEYWORDS.items():
    for kw in keywords:
        word_pattern = re.compile(r'\b' + re.escape(kw) + r'\b')
        if word_pattern.search(text_no_accents):
            if category not in detected_moods:
                detected_moods.append(category)
            distribution[category] = max(distribution.get(category, 0), 30.0)
            break
```

### Fix 5: Fix JSON encoding corruption
**File:** `ai_api/mexican_slang_dataset.json`
Replace all corrupted characters:
- `ǭ` → `á` (fantástico, está, difícil)
- `Ǭ` → `Á` (agüitado)
- Various `��` → proper UTF-8

## Expected Result
After fixes, "me siento a toda madre" → primary_mood="Excelente", detected_moods=["Feliz","Excelente"], distribution ONLY shows these.
