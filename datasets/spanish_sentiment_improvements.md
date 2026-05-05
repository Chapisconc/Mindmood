# Spanish Sentiment Datasets for Diary App Improvement

## 1. Spanish Tweets Sentiment (Primary - Compact 50k samples)

- **Link**: https://www.kaggle.com/datasets/equinxx/spanish-tweets-sentiment
- **Size**: 5MB CSV
- **Labels**: 0=neg, 1=neu, 2=pos
- **Use**: Lexicon expansion + VADER fine-tuning
- **Sample**:
  ```
  tweet_text,label
  "no puede ser mas estupido...",0
  "Me encanta este producto!",2
  ```

## 2. TASS Spanish Sentiment

- **Link**: https://www.kaggle.com/datasets/rtatman/spanish-language-sentiment-analysis-dataset
- **Size**: <1MB
- **Labels**: POS/NEG/NEU/NONE

## Lexicon Extraction Script (run after download)

```python
import pandas as pd
from collections import defaultdict
import re

df = pd.read_csv('datasets/spanish-tweets-sentiment/train.csv')  # unzip
word_polarity = defaultdict(float)
for _, row in df.iterrows():
    words = re.findall(r'\\w+', row['tweet_text'].lower())
    pol = row['label'] - 1  # -1 to +1
    for w in words:
        word_polarity[w] += pol / len(words)

lexicon = dict(sorted(word_polarity.items(), key=lambda x: abs(x[1]), reverse=True)[:500])
print(lexicon)  # Add to CUSTOM_LEXICON
```

## Expected Lexicon Additions (from sample data)

```
'enamorado': 1.8, 'felicidad': 1.6, 'terrible': -1.9, 'estupido': -2.1, 'crisis': -2.5
```

**Next**: `pip install pandas kaggle &amp;&amp; kaggle datasets download ...`
