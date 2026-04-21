import requests
import time

URL = "http://127.0.0.0:8000/analyze"

test_cases = [
    "mi día estaba chido por no decir que excelente",
    "Hoy me siento bien agüitado por cosas del trabajo.",
    "Todo el proyecto quedó al chile bien perrón, me encantó.",
    "La neta me lleva la chingada, no quiero saber nada.",
    "El concierto estuvo muy padre, la pasé chido.",
    "Qué hueva de día, todo salió muy chafa.",
    "Hoy me fue de la chingada, todo mundo fue bien culero conmigo.",
    "Me siento de pelos hoy con mi compa.",
    "No mames, el examen estuvo bien cabrón.",
    "Mañana tengo mucha chamba pero ni modo.",
    "Me cae gordo ese wey, es bien fresa.",
    "Qué oso lo que pasó ayer en la peda.",
    "Estoy a toda madre después de las vacaciones."
]

with open("test_results.md", "w", encoding="utf-8") as f:
    f.write("# Resultados de Evaluaciones de Jerga Mexicana\n\n")
    f.write("| Entrada Literal del Usuario | Emoción Detectada | Energía (Score) | Requiere Ayuda |\n")
    f.write("|---|---|---|---|\n")

    for text in test_cases:
        try:
            resp = requests.post("http://127.0.0.1:8000/analyze", json={"text": text})
            data = resp.json()
            help_flag = "⚠️ SÍ" if data["requires_help"] else "No"
            f.write(f"| {text} | {data['mood']} | {data['score']} | {help_flag} |\n")
        except Exception as e:
            f.write(f"| {text} | Error: {e} | - | - |\n")
        time.sleep(1)
