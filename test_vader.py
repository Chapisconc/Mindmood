from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
# from googletrans import Translator  # Waiting pip
import re

analyzer = SentimentIntensityAnalyzer()
# translator = Translator()

def preprocess(text):
    text = re.sub(r'http\S+', '', text)  # remove URLs
    text = re.sub(r'@\w+', '', text)  # remove mentions
    text = re.sub(r'#\w+', '', text)  # remove hashtags
    text = re.sub(r'[^a-zA-Z0-9\s.,!?;:\-]', '', text)  # keep basic
    return text.strip()

def analyze_sentiment(text, translate=False):
    processed = preprocess(text)
    text_to_analyze = processed
    if translate:
        # Placeholder - use when googletrans ready
        text_to_analyze = processed  # direct for now
    scores = analyzer.polarity_scores(text_to_analyze)
    return {
        'compound': scores['compound'],
        'pos': scores['pos'],
        'neu': scores['neu'],
        'neg': scores['neg'],
        'text_used': text_to_analyze
    }

# Test VADER English
english_sample = "Today was a terrible day, everything went wrong, I'm very sad and anxious about the future."
print('English:', analyze_sentiment(english_sample))

# Test Spanish direct
spanish_sample = "Hoy fue un día terrible, todo salió mal, estoy muy triste y ansioso por el futuro."
print('Spanish direct:', analyze_sentiment(spanish_sample))
