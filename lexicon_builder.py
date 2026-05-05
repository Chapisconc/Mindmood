import pandas as pd
from collections import defaultdict
import re
import json

print("Loading dataset...")
df = pd.read_csv('datasets/spanish_tweets_sample.csv')
word_polarity = defaultdict(float)

print("Building lexicon...")
for _, row in df.iterrows():
    words = re.findall(r'\w+', row['tweet_text'].lower())
    if len(words) == 0:
        continue
    pol = (row['label'] - 1) / len(words)
    for w in words:
        word_polarity[w] += pol

lexicon = dict(sorted(word_polarity.items(), key=lambda x: abs(x[1]), reverse=True))

print(f"Lexicon built with {len(lexicon)} words.")

with open('datasets/spanish_lexicon.json', 'w', encoding='utf-8') as f:
    json.dump(lexicon, f, ensure_ascii=False, indent=2)

print("Spanish lexicon saved to datasets/spanish_lexicon.json")

# Display top 20 most polarized words
print("\nTop 20 most polarized words:")
for word, polarity in list(lexicon.items())[:20]:
    print(f"  {word}: {polarity:.3f}")
