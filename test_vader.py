from deep_translator import GoogleTranslator
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()
translator = GoogleTranslator(source='es', target='en')

phrases = [
    "Me duele el estómago, pero mi novia me dijo que sí se quiere casar conmigo.",
    "Aprobé mi examen de matemáticas aunque me costó mucho trabajo.",
    "Todo ha sido un desastre hoy, perdí mis llaves y llegué tarde.",
    "Me siento muy tranquilo en este momento, no pasa nada interesante.",
    "Estoy muy feliz y emocionado por el nuevo proyecto."
]

print("=== VADER SPANISH TEST ===")
for text in phrases:
    eng = translator.translate(text)
    score = analyzer.polarity_scores(eng)
    compound = score['compound']
    
    if compound >= 0.05:
        mood = "Feliz"
    elif compound <= -0.05:
        mood = "Triste"
    else:
        mood = "Neutral"
        
    print(f"ES: {text}")
    print(f"EN: {eng}")
    print(f"SCORE: {compound} -> {mood}\n")
