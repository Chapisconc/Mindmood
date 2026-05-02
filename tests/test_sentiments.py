import requests
import json

BASE_URL = "http://127.0.0.1:8000/analyze"

test_cases = [
    # 🌟 EXCELENTE
    {"text": "¡Hoy es el mejor día de mi vida! Me ascendieron y me siento increíble.", "expected": "Excelente"},
    
    # 😊 FELIZ
    {"text": "Estoy muy contento con los resultados de hoy, todo salió muy chido.", "expected": "Feliz"},
    
    # 🙏 AGRADECIDO
    {"text": "Me siento muy agradecido por tener a mi familia conmigo.", "expected": "Agradecido"},
    
    # 😲 SORPRESA
    {"text": "¡No lo puedo creer! Me gané la lotería sin esperarlo.", "expected": "Sorpresa"},
    
    # 😐 NEUTRAL
    {"text": "Hoy fui al trabajo, comí algo y regresé. Un día normal.", "expected": "Neutral"},
    
    # 😠 ENOJO / ODIO
    {"text": "Odio a todo el mundo, me da mucho coraje cómo me tratan.", "expected": "Enojo"},
    {"text": "Mi jefe me aventó las carpetas, tengo ganas de darle un puñetazo.", "expected": "Enojo"},
    
    # 😔 TRISTE
    {"text": "Me siento muy solo y triste, nada me sale bien hoy.", "expected": "Triste"},
    
    # 😰 ANSIEDAD
    {"text": "Tengo mucho estrés por el examen de mañana, me tiemblan las manos.", "expected": "Ansiedad"},
    
    # 🆘 CRISIS
    {"text": "Ya no quiero vivir, me siento completamente perdido y sin salida.", "expected": "Crisis"},
    {"text": "Me quiero morir, ya no aguanto más este dolor.", "expected": "Crisis"},
]

def run_tests():
    print("Iniciando pruebas de sentimiento MindMood...\n")
    passed = 0
    failed = 0
    
    for i, case in enumerate(test_cases):
        try:
            response = requests.post(BASE_URL, json={"text": case["text"]})
            data = response.json()
            result = data["mood"]
            
            status = "PASO" if result == case["expected"] else "FALLO"
            if result == case["expected"]:
                passed += 1
            else:
                failed += 1
                
            print(f"Prueba {i+1}: {case['text'][:40]}...")
            print(f"   Esperado: {case['expected']} | Resultado: {result} | {status}\n")
            
        except Exception as e:
            print(f"Error en prueba {i+1}: {e}")
            failed += 1

    print("-" * 30)
    print(f"Resumen: {passed} Pasadas | {failed} Fallidas")
    print("-" * 30)

if __name__ == "__main__":
    run_tests()
