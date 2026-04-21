"""test_spanish.py"""
from sentiment_analysis import analyze_entry

tests = [
    ("me quiero morir",             "Malo o Muy malo"),
    ("hoy es el peor dia de mi vida, me siento horrible", "Malo o Muy malo"),
    ("estoy muy feliz, todo estuvo genial hoy", "Bueno o Muy bueno"),
    ("me siento triste y deprimido, sin ganas de nada", "Malo o Muy malo"),
    ("estoy emocionado con mi vida, todo va increible", "Bueno o Muy bueno"),
    ("dia normal, nada especial", "Regular"),
]

print("=" * 60)
print("TEST DE ANÁLISIS EN ESPAÑOL")
print("=" * 60)
all_pass = True
for text, expected in tests:
    r = analyze_entry(text)
    ok = "✅" if r["mood_label"] not in ["Regular"] or "normal" in expected.lower() else "⚠️"
    print(f"\nTexto    : {text!r}")
    print(f"Compound μ: {r['compound_mean']:+.3f}  |  Score S: {r['mood_score']:+.3f}")
    print(f"Etiqueta : {r['mood_label']}  (esperado: {expected})")

print("\n" + "=" * 60)
print("Verificación clave: 'me quiero morir'")
r = analyze_entry("me quiero morir")
print(f"  Compound μ : {r['compound_mean']:+.3f}")
print(f"  Mood Score : {r['mood_score']:+.3f}")
print(f"  Etiqueta   : {r['mood_label']}")
assert r["mood_label"] in ("Malo", "Muy malo"), f"FALLO: era {r['mood_label']}, esperado Malo o Muy malo"
print("  ✅ CORRECTO — ya no clasifica como Regular")
print("=" * 60)
