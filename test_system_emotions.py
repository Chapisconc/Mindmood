import requests
import json

# Configuración
API_URL = "http://localhost:8000/analyze"

# Casos de prueba por emoción
test_cases = [
    {
        "name": "MIEDO",
        "text": "Tengo mucho miedo, me siento vulnerable y desprotegido en la oscuridad.",
        "expected_mood": "Miedo"
    },
    {
        "name": "ANSIEDAD",
        "text": "No puedo dejar de pensar en el futuro, tengo palpitaciones y me siento muy ansioso.",
        "expected_mood": "Ansiedad"
    },
    {
        "name": "ENOJO",
        "text": "Estoy furioso, esto es un insulto y me siento muy agraviado por lo que pasó.",
        "expected_mood": "Enojo"
    },
    {
        "name": "TRISTEZA",
        "text": "Me siento muy solo y desolado, la melancolía me invade hoy.",
        "expected_mood": "Triste"
    },
    {
        "name": "AGRADECIDO",
        "text": "Estoy profundamente agradecido por todo el apoyo que he recibido.",
        "expected_mood": "Agradecido"
    },
    {
        "name": "SORPRESA",
        "text": "¡Órale! ¡Zaz! No me esperaba esto, quedé totalmente desconcertado.",
        "expected_mood": "Sorpresa"
    },
    {
        "name": "CRISIS",
        "text": "Ya no puedo más, no hay salida, quiero acabar con todo.",
        "expected_mood": "Crisis"
    },
    {
        "name": "MULTI-EMOCIÓN",
        "text": "Estoy muy feliz por mi ascenso pero me da miedo la responsabilidad.",
        "expected_mood": "Feliz" # El primario suele ser el positivo si el score es alto
    },
    {
        "name": "JERGA MEXICANA",
        "text": "Ando bien aguitado y que me parta un rayo.",
        "expected_moods": ["Triste", "Enojo"]
    }
]

def run_tests():
    print("--- INICIANDO PRUEBAS DE EMOCIONES MINDMOOD v2.1 ---\n")
    print("-" * 60)
    
    passed = 0
    total = len(test_cases)
    
    for case in test_cases:
        print(f"Probando: {case['name']}")
        print(f"Texto: '{case['text']}'")
        
        try:
            response = requests.post(API_URL, json={"text": case["text"]}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                primary = data["mood"]
                distribution = data["emotions_distribution"]
                
                print(f"Resultado: {primary}")
                print(f"Distribución: {json.dumps(distribution, ensure_ascii=False)}")
                
                # Verificación flexible
                if "expected_mood" in case:
                    if primary == case["expected_mood"]:
                        passed += 1
                        print("COINCIDENCIA EXACTA!")
                    elif case["expected_mood"] in data["all_moods"]:
                        passed += 1
                        print("ENCONTRADA EN LISTA MULTI-EMOCIÓN")
                    else:
                        print(f"No coincidió (Esperaba: {case['expected_mood']})")
                
                elif "expected_moods" in case:
                    if all(m in data["all_moods"] for m in case["expected_moods"]):
                        passed += 1
                        print("MULTI-EMOCIÓN DETECTADA CORRECTAMENTE")
                    else:
                        print(f"Faltaron emociones (Esperaba: {case['expected_moods']})")
            else:
                print(f"Error de API: {response.status_code}")
        except Exception as e:
            print(f"Error de conexión: {str(e)}")
            
        print("-" * 60)
        
    print(f"\nRESUMEN: {passed}/{total} pruebas pasadas.")
    if passed == total:
        print("SISTEMA VALIDADO AL 100%!")

if __name__ == "__main__":
    run_tests()
