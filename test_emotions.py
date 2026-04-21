"""
Test script to verify all emotion categories in the MindMood AI backend.
Sends sample texts and checks that the correct moods are detected.
"""
import requests
import json

API_URL = "http://192.168.1.70:8000/analyze"

test_cases = [
    # (description, text, expected_primary_mood, expected_moods_contain)
    ("Felicidad intensa", 
     "Hoy fue el mejor día de mi vida, me siento increíblemente feliz y bendecido por todo lo que tengo", 
     "Excelente", ["Excelente"]),
    
    ("Felicidad moderada", 
     "Me fue bien en el examen, estoy contento con mis resultados", 
     "Feliz", ["Feliz"]),
    
    ("Enojo puro", 
     "Estoy muy enojado y frustrado, todo me sale mal y estoy harto de esta situación", 
     "Enojo", ["Enojo"]),
    
    ("Ansiedad pura", 
     "Me siento muy ansioso y estresado por el trabajo, los nervios no me dejan dormir", 
     "Ansiedad", ["Ansiedad"]),
    
    ("Miedo", 
     "Tengo mucho miedo de lo que pueda pasar, siento un temor terrible por el futuro", 
     "Miedo", ["Miedo"]),
    
    ("Agradecimiento", 
     "Estoy muy agradecido por mi familia, siento mucha gratitud por todo lo que me dan", 
     "Agradecido", ["Agradecido"]),
    
    ("Sorpresa", 
     "No puedo creer lo que pasó hoy, fue una sorpresa increíble, estoy asombrado", 
     "Sorpresa", ["Sorpresa"]),
    
    ("Tristeza", 
     "Me siento triste y solo, nada tiene sentido últimamente", 
     "Triste", ["Triste"]),
    
    ("Crisis", 
     "Ya no puedo más, me siento deprimido y sin esperanza, todo es terrible", 
     "Crisis", ["Crisis"]),
    
    ("Neutral", 
     "Hoy fui al mercado a comprar frutas y verduras para la semana", 
     "Neutral", []),
    
    ("Emociones mixtas: Feliz + Ansiedad", 
     "Estoy muy feliz por mi nuevo trabajo pero me siento muy ansioso y nervioso por el primer día", 
     None, ["Ansiedad"]),  # Primary could vary, but Ansiedad must be detected
    
    ("Emociones mixtas: Agradecido + Miedo", 
     "Agradezco mucho a mi familia pero tengo mucho miedo de no cumplir sus expectativas", 
     None, ["Agradecido", "Miedo"]),
    
    ("Jerga mexicana positiva", 
     "Estuvo bien chingón el partido wey, a toda madre", 
     "Excelente", ["Excelente"]),
    
    ("Jerga mexicana negativa", 
     "Me siento bien aguitado y jodido, todo está culero", 
     None, []),  # Should be negative
]

print("=" * 80)
print("TEST DE EMOCIONES - MindMood AI Backend")
print("=" * 80)

passed = 0
failed = 0
errors = []

for desc, text, expected_primary, expected_contains in test_cases:
    try:
        resp = requests.post(API_URL, json={"text": text}, timeout=10)
        result = resp.json()
        
        mood = result.get("mood", "???")
        all_moods = result.get("all_moods", [])
        score = result.get("score", 0)
        summary = result.get("summary", "")
        requires_help = result.get("requires_help", False)
        
        # Check primary mood
        primary_ok = expected_primary is None or mood == expected_primary
        
        # Check that expected moods are in the detected list
        contains_ok = all(m in all_moods for m in expected_contains)
        
        test_pass = primary_ok and contains_ok
        
        icon = "[OK]" if test_pass else "[FAIL]"
        if test_pass:
            passed += 1
        else:
            failed += 1
            errors.append(desc)
        
        print(f"\n{icon} {desc}")
        print(f"   Texto: \"{text[:60]}...\"")
        print(f"   Mood primario: {mood} (esperado: {expected_primary or 'cualquiera'})")
        print(f"   Todas las emociones: {all_moods}")
        print(f"   Score: {score:.3f} | Requiere ayuda: {requires_help}")
        print(f"   Resumen: \"{summary}\"")
        if not test_pass:
            print(f"   FALLO: Se esperaba que contuviera {expected_contains}")
            
    except requests.exceptions.ConnectionError:
        failed += 1
        errors.append(desc)
        print(f"\n[FAIL] {desc}")
        print(f"   ERROR: No se pudo conectar al backend en {API_URL}")
        break
    except Exception as e:
        failed += 1
        errors.append(desc)
        print(f"\n[FAIL] {desc}")
        print(f"   ERROR: {e}")

print("\n" + "=" * 80)
print(f"RESULTADOS: {passed} pasaron | {failed} fallaron | Total: {passed + failed}")
if errors:
    print(f"Fallos: {', '.join(errors)}")
else:
    print("Todas las pruebas pasaron!")
print("=" * 80)
