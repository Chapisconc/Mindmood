import requests
import json

BASE_URL = "http://127.0.0.1:8000/analyze"

test_cases = [
    # 1. ENVIDO / ODIO
    {"text": "Estoy tan enojado con mi jefe que le podría gritar", "expected": "Enojo"},
    {"text": "Siento un odio profundo cada vez que lo veo", "expected": "Enojo"},
    {"text": "Me da mucha rabia que me ignoren", "expected": "Enojo"},
    {"text": "Detesto esta situación con toda mi alma", "expected": "Enojo"},
    {"text": "¡Qué coraje! Otra vez se me olvidó la cartera", "expected": "Enojo"},
    {"text": "Estoy harto de que siempre lleguen tarde", "expected": "Enojo"},

    # 2. ANSIEDAD
    {"text": "No puedo dormir, tengo una ansiedad que me consume", "expected": "Ansiedad"},
    {"text": "El estrés del trabajo me está matando", "expected": "Ansiedad"},
    {"text": "Me siento tan abrumado que no sé por dónde empezar", "expected": "Ansiedad"},
    {"text": "Mañana tengo el examen y estoy de los nervios", "expected": "Ansiedad"},
    {"text": "Siento que el pecho me va a explotar de la angustia", "expected": "Ansiedad"},
    {"text": "Todo me preocupa, no puedo dejar de pensar", "expected": "Ansiedad"},

    # 3. MIEDO
    {"text": "Tengo miedo de perder mi trabajo", "expected": "Miedo"},
    {"text": "Me aterra la idea de estar solo para siempre", "expected": "Miedo"},
    {"text": "Cuando camino de noche, siento pavor", "expected": "Miedo"},
    {"text": "Estoy aterrado por lo que pueda pasar mañana", "expected": "Miedo"},
    {"text": "Siento una inseguridad que me paraliza", "expected": "Miedo"},
    {"text": "Cada ruido me hace saltar del susto", "expected": "Miedo"},

    # 4. TRISTEZA
    {"text": "Me siento muy triste desde que se fue", "expected": "Triste"},
    {"text": "Estoy deprimido y sin ganas de hacer nada", "expected": "Triste"},
    {"text": "Hay un vacío enorme en mi corazón", "expected": "Triste"},
    {"text": "Todo me sale mal, qué desdicha", "expected": "Triste"},
    {"text": "Hoy desperté con una tristeza profunda", "expected": "Triste"},
    {"text": "Siento que nada vale la pena", "expected": "Triste"},

    # 5. AGRADECIMIENTO
    {"text": "Gracias a la vida por todo lo que me ha dado", "expected": "Agradecido"},
    {"text": "Hoy me siento profundamente agradecido", "expected": "Agradecido"},
    {"text": "Qué bendición tener gente que me quiere", "expected": "Agradecido"},
    {"text": "Soy tan afortunado de tener salud y trabajo", "expected": "Agradecido"},
    {"text": "Gracias, de verdad, por estar a mi lado", "expected": "Agradecido"},
    {"text": "Me siento honrado de recibir este reconocimiento", "expected": "Agradecido"},

    # 6. SORPRESA
    {"text": "¡No me lo puedo creer! ¡Gané el premio!", "expected": "Sorpresa"},
    {"text": "Qué sorpresa tan grande verte por aquí", "expected": "Sorpresa"},
    {"text": "Me dejó atónito la noticia de su renuncia", "expected": "Sorpresa"},
    {"text": "Esto es increíble, jamás lo hubiera imaginado", "expected": "Sorpresa"},
    {"text": "¡Qué inesperado! No tenía ni idea", "expected": "Sorpresa"},
    {"text": "Me impactó muchísimo lo que me contaste", "expected": "Sorpresa"},

    # 7. CRISIS
    {"text": "Ya no aguanto más esta situación", "expected": "Crisis"},
    {"text": "Siento que no puedo más, estoy completamente perdido", "expected": "Crisis"},
    {"text": "A veces pienso que sería mejor no existir", "expected": "Crisis"},
    {"text": "No le encuentro salida a esto, estoy desesperado", "expected": "Crisis"},
    {"text": "Me odio, odio mi vida, no sé qué hacer", "expected": "Crisis"},
    {"text": "Quiero desaparecer, no soporto este dolor", "expected": "Crisis"},

    # 8. FELICIDAD
    {"text": "¡Qué feliz estoy hoy!", "expected": "Feliz"},
    {"text": "Siento una alegría inmensa en el corazón", "expected": "Feliz"},
    {"text": "Estoy disfrutando cada momento de este día", "expected": "Feliz"},
    {"text": "Qué contento me hace verte sonreír", "expected": "Feliz"},
    {"text": "La vida es hermosa cuando hay gozo", "expected": "Feliz"},
    {"text": "Ando de buenas, todo me sale bien", "expected": "Feliz"},

    # 9. EXCELENTE / EUFÓRICO
    {"text": "¡Esto es excelente! ¡No puedo pedir más!", "expected": "Excelente"},
    {"text": "¡Qué maravilloso! ¡Pasé el examen final!", "expected": "Excelente"},
    {"text": "Es un día perfecto en todos los sentidos", "expected": "Excelente"},
    {"text": "¡Triunfamos! ¡Ganamos el campeonato!", "expected": "Excelente"},
    {"text": "Me siento radiante y eufórico", "expected": "Excelente"},
    {"text": "¡Insuperable! Hoy todo salió espectacular", "expected": "Excelente"},

    # 10. NEUTRAL
    {"text": "Hoy fui al supermercado e hice la despensa", "expected": "Neutral"},
    {"text": "El clima está nublado y fresco", "expected": "Neutral"},
    {"text": "Mañana tengo junta a las diez", "expected": "Neutral"},
    {"text": "Voy a preparar la cena para la familia", "expected": "Neutral"},
    {"text": "Terminé de leer el libro que tenía pendiente", "expected": "Neutral"},
]

def run_tests():
    print("Iniciando pruebas de sentimiento MindMood (HuggingFace Compatible)...\n")
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
            print(f"   Esperado: {case['expected']} | Resultado: {result} | {status}")
            if result != case["expected"]:
                print(f"   DETALLE: Score: {data['score']} | Crisis: {data['crisis_level']}")
            print()
            
        except Exception as e:
            print(f"Error en prueba {i+1}: {e}")
            failed += 1

    print("-" * 30)
    print(f"Resumen: {passed} Pasadas | {failed} Fallidas")
    print("-" * 30)

if __name__ == "__main__":
    run_tests()
