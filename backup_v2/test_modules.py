"""
test_modules.py — Pruebas funcionales de todos los módulos del proyecto.
Ejecutar con: python test_modules.py
"""
import os, sys

print("=" * 60)
print("DIARIO PERSONAL INTELIGENTE — Test de módulos")
print("=" * 60)

# ─── text_processing ─────────────────────────────────────────────
print("\n[1] text_processing.py")
from text_processing import (
    split_into_sentences,
    extract_emotional_keywords,
    count_negations,
    count_intensifiers,
)

text_en = (
    "Today was absolutely amazing. "
    "I felt happy and energized all morning. "
    "However, there was one terrible moment that made me very sad and frustrated. "
    "I don't know if I can handle this stress anymore."
)
sents = split_into_sentences(text_en)
print(f"  Oraciones detectadas: {len(sents)}")
assert len(sents) >= 3, "Debe haber ≥3 oraciones"

kw = extract_emotional_keywords(text_en)
print(f"  Palabras positivas: {kw['positive']}")
print(f"  Palabras negativas: {kw['negative']}")
assert len(kw["positive"]) > 0, "Debe haber palabras positivas"
assert len(kw["negative"]) > 0, "Debe haber palabras negativas"

neg_count = count_negations(text_en)
int_count = count_intensifiers(text_en)
print(f"  Negaciones: {neg_count}, Intensificadores: {int_count}")
print("  ✅ OK")

# ─── sentiment_analysis ──────────────────────────────────────────
print("\n[2] sentiment_analysis.py")
from sentiment_analysis import analyze_entry

result = analyze_entry(text_en)
print(f"  Etiqueta: {result['mood_label']}")
print(f"  Compound μ: {result['compound_mean']}")
print(f"  Compound σ: {result['compound_std']}")
print(f"  Intensidad máx: {result['intensity_max']}")
print(f"  Mood score (S): {result['mood_score']}")
print(f"  Variabilidad Ev: {result['emotional_var']}")
print(f"  Oraciones: {result['sentence_count']}")
print(f"  Cambios bruscos: {result['abrupt_changes']}")
print(f"  Contradictorio: {result['contradictory']}")
assert result["sentence_count"] >= 3
assert -1.0 <= result["mood_score"] <= 1.0
assert result["mood_label"] in {"Muy bueno","Bueno","Regular","Malo","Muy malo"}
print("  ✅ OK")

# ─── database ────────────────────────────────────────────────────
print("\n[3] database.py")
from database import init_db, save_entry, get_all_entries, count_entries, delete_entry

init_db()
prev = count_entries()
eid = save_entry(text_en, result)
print(f"  Entrada guardada con ID={eid}")
assert count_entries() == prev + 1

entries = get_all_entries()
assert len(entries) >= 1
assert entries[0]["mood_label"] in {"Muy bueno","Bueno","Regular","Malo","Muy malo"}

deleted = delete_entry(eid)
assert deleted, "Debe eliminar la entrada de prueba"
assert count_entries() == prev
print("  ✅ OK")

# ─── statistics ──────────────────────────────────────────────────
print("\n[4] statistics.py")
import statistics as stats_module

# Insertar 3 entradas de prueba para poder calcular estadísticas
texts = [
    "I am extremely happy today. Everything went perfectly well.",
    "It was a normal day. Nothing special happened. Just regular stuff.",
    "I feel terrible and very sad. This was the worst day ever.",
]
ids = []
for t in texts:
    r = analyze_entry(t)
    ids.append(save_entry(t, r))

all_entries = get_all_entries()
stats = stats_module.compute_all_stats(all_entries)

print(f"  Total entradas: {stats['total_entries']}")
print(f"  Compound global: {stats['global_compound_mean']}")
print(f"  ISE: {stats['stability_index']}")
print(f"  Tendencia: {stats['linear_trend']['trend_label']}")
print(f"  % Muy positivos: {stats['pct_very_positive']}")
print(f"  % Muy negativos: {stats['pct_very_negative']}")
print(f"  Distribución: {stats['mood_distribution']}")
assert 0.0 <= stats["stability_index"] <= 1.0
assert stats["total_entries"] >= 3

# Limpiar entradas de prueba
for i in ids:
    delete_entry(i)
print("  ✅ OK")

# ─── utils ───────────────────────────────────────────────────────
print("\n[5] utils.py")
from utils import (
    validate_entry, format_datetime, format_compound,
    compound_to_color, truncate_text, stability_label, score_bar,
)

ok, msg = validate_entry("Hi")
assert not ok  # muy corto

ok, msg = validate_entry("This is a valid entry text for testing.")
assert ok, msg

color = compound_to_color(0.5)
assert color.startswith("#")

bar = score_bar(0.0)
assert "●" in bar

label = stability_label(0.9)
assert "estable" in label.lower()
print("  ✅ OK")

# ─── Resumen ─────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("✅ TODOS LOS MÓDULOS PASARON LAS PRUEBAS CORRECTAMENTE")
print("=" * 60)
print("\nEjecuta la app con:")
print("  streamlit run app.py")
