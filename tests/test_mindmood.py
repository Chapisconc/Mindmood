"""
Casos de Prueba — MindMood (15 tests, ISO/IEC 25010)
Modulos: TestModular (Pruebas Unitarias), TestIntegration (Pruebas de Integracion),
         TestSystem (Pruebas de Sistema).
Ejecutar: python -m pytest tests/ -v

Materia: SEMINARIO DE INGENIERIA DE SOFTWARE
Alumno:  RAMIREZ RUIZ, CRISTOPHER SAID
Seccion: D15 — CUCEI Guadalajara Jalisco
"""

# ===== IMPORTS =====
# pytest: framework de pruebas; json: manejo de archivos de datos (slang);
# re: expresiones regulares; os/sys: manipulacion de rutas y path;
# time: medicion de rendimiento; emoji: limpieza de emojis en texto.
import pytest, json, re, os, sys, time, emoji

# Inserta el directorio ai_api/ al inicio de sys.path para que los modulos
# del backend (main.py) puedan importarse sin errores de resolucion.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai_api'))

# ===== PARTE 1: PRUEBAS MODULARES (UNITARIAS) =====
class TestModular:
    """Pruebas unitarias modulares que verifican funciones individuales del
    backend de forma aislada: limpieza de emojis, normalizacion de jerga
    mexicana, deteccion de crisis, multiplicadores de intensificadores y
    deteccion de negacion."""
    def test_PM001_emoji_removal(self):
        """PM001 — Verifica que la funcion emoji.replace_emoji() elimina
        correctamente todos los emojis del texto, dejando solo el contenido
        textual limpio para su posterior analisis de sentimiento."""
        text = "Hoy estoy feliz 😊🎉 y contento 🥳"
        # Aplica la eliminacion de emojis usando la libreria 'emoji' con
        # reemplazo por cadena vacia para despejar el texto.
        cleaned = emoji.replace_emoji(text, replace='')
        # Confirma que los tres emojis originales ya no existen en el resultado.
        assert "😊" not in cleaned and "🎉" not in cleaned

    def test_PM002_mexican_slang_normalization(self):
        """PM002 — Verifica que el dataset de jerga mexicana se cargue
        correctamente desde el archivo JSON y contenga el mapeo esperado
        de palabras coloquiales ('chido' -> 'excelente')."""
        # Construye la ruta absoluta al archivo de slang partiendo de la
        # ubicacion de este script (tests/) hacia ai_api/.
        path = os.path.join(os.path.dirname(__file__), '..', 'ai_api', 'mexican_slang_dataset.json')
        # Abre y carga el JSON forzando codificacion UTF-8 para caracteres
        # especiales del espanol.
        with open(path, encoding='utf-8') as f:
            slang = json.load(f)
        # Asegura que el dataset tenga al menos 20 entradas (cobertura minima).
        assert len(slang) > 20
        # Verifica que la palabra coloquial "chido" se normalice a "excelente".
        assert slang.get("chido") == "excelente"

    def test_PM003_crisis_keywords_detection(self):
        """PM003 — Verifica que has_crisis_indicators() detecte correctamente
        frases con ideacion suicida ("me quiero morir" -> True) y no genere
        falsos positivos en textos neutros ("hoy fue un buen dia" -> False)."""
        from main import has_crisis_indicators
        # Frase con claros indicadores de crisis: debe devolver True.
        assert has_crisis_indicators("me quiero morir") == True
        # Frase positiva/sin indicadores: debe devolver False para evitar
        # falsas alertas que saturarian al sistema de soporte.
        assert has_crisis_indicators("hoy fue un buen dia") == False

    def test_PM004_intensifier_multiplier(self):
        """PM004 — Verifica que get_intensifier_multiplier() calcule el factor
        de intensidad correctamente: "muy" > 1.0, "algo" == 1.0 (sin efecto),
        y que multiples intensificadores tengan un tope maximo de 1.5x."""
        from main import get_intensifier_multiplier
        # "muy" antes de "feliz" debe incrementar el multiplicador (> 1.0).
        assert get_intensifier_multiplier("muy feliz") > 1.0
        # "algo" es un intensificador debil y debe devolver 1.0 (sin cambio).
        assert get_intensifier_multiplier("algo normal") == 1.0
        # Acumulacion de intensificadores no debe exceder 1.5x (saturacion).
        assert get_intensifier_multiplier("muy extremadamente super") <= 1.5

    def test_PM005_negation_detection(self):
        """PM005 — Verifica que detect_negation() identifique correctamente la
        presencia de palabras de negacion ("no") en el texto, lo cual es
        fundamental para invertir la polaridad del sentimiento analizado."""
        from main import detect_negation
        # Texto con "no": debe detectar negacion (True).
        assert detect_negation("no estoy bien") == True
        # Texto sin negacion: debe retornar False.
        assert detect_negation("estoy bien") == False

# ===== PARTE 2: PRUEBAS DE INTEGRACION =====
class TestIntegration:
    """Pruebas de integracion que validan el pipeline completo del endpoint
    /analyze, desde la recepcion de la solicitud HTTP hasta la respuesta JSON,
    incluyendo normalizacion de jerga, deteccion de crisis y analisis
    de sentimiento con FastAPI TestClient."""

    def test_PI001_full_analysis_pipeline_positive(self):
        """PI001 — Verifica que el pipeline completo devuelva un score positivo
        y un mood adecuado ("Feliz" o "Excelente") para un texto claramente
        positivo, confirmando el flujo feliz de la aplicacion."""
        from main import app; from fastapi.testclient import TestClient
        # Envia una entrada con sentimiento positivo explicito al endpoint.
        res = TestClient(app).post("/analyze", json={"text": "Hoy fue un dia maravilloso, me siento muy feliz"})
        assert res.status_code == 200
        data = res.json()
        # Score debe ser positivo para texto alegre.
        assert data["score"] > 0
        # El mood categorizado debe coincidir con emociones positivas.
        assert data["mood"] in ["Feliz", "Excelente"]

    def test_PI002_full_analysis_pipeline_negative(self):
        """PI002 — Verifica que el pipeline devuelva un score negativo para
        texto con emociones negativas ("triste", "deprimido"), validando la
        correcta polarizacion del analisis de sentimiento."""
        from main import app; from fastapi.testclient import TestClient
        res = TestClient(app).post("/analyze", json={"text": "Estoy muy triste y deprimido, todo va mal"})
        assert res.status_code == 200
        # Score negativo confirma que el modelo detecta la polaridad triste.
        assert res.json()["score"] < 0

    def test_PI003_slang_to_analysis_integration(self):
        """PI003 — Verifica que el pipeline integre correctamente la
        normalizacion de jerga mexicana ("aguitado" -> "triste",
        "chafa" -> "malo") antes del analisis, produciendo un score negativo
        consistente."""
        from main import app; from fastapi.testclient import TestClient
        res = TestClient(app).post("/analyze", json={"text": "Estoy bien aguitado, todo esta chafa"})
        assert res.status_code == 200
        # Score negativo indica que la jerga fue normalizada correctamente
        # y su polaridad negativa se refleja en el resultado.
        assert res.json()["score"] < 0

    def test_PI004_crisis_detection_integration(self):
        """PI004 — Verifica que el pipeline completo active la bandera de
        crisis (requires_help = True) y reporte el nivel "critical" ante
        frases con ideacion suicida explicita."""
        from main import app; from fastapi.testclient import TestClient
        res = TestClient(app).post("/analyze", json={"text": "Ya no quiero vivir, quiero desaparecer"})
        assert res.status_code == 200
        data = res.json()
        # El sistema debe marcar esta entrada como requiring ayuda inmediata.
        assert data["requires_help"] == True
        # El nivel de crisis debe ser el maximo ("critical") para activar
        # los protocolos de emergencia del modulo de soporte.
        assert data["crisis_level"] == "critical"

    @pytest.mark.xfail(reason="PI-005: analyze_emotional_reinforcement corre antes de emoji.replace_emoji. "
                               "Parche: mover reinforcement = analyze_emotional_reinforcement(original_text) "
                               "despues de la llamada a emoji.replace_emoji en main.py linea 529.")
    def test_PI005_emoji_stripped_before_analysis(self):
        """PI005 (XFAIL) — Verifica que los emojis se eliminen ANTES del
        analisis de sentimiento para que no alteren el score. Actualmente
        falla porque analyze_emotional_reinforcement() procesa el texto
        original con emojis, inflando el score. Marcada como xfail hasta
        que se corrija el orden del pipeline en main.py (linea 529)."""
        from main import app; from fastapi.testclient import TestClient
        client = TestClient(app)
        # Mismo texto sin y con emojis; los scores DEBERIAN ser identicos.
        r1 = client.post("/analyze", json={"text": "Estoy bien"})
        r2 = client.post("/analyze", json={"text": "Estoy bien 😊😊"})
        assert r1.status_code == 200 and r2.status_code == 200
        s1, s2 = r1.json()["score"], r2.json()["score"]
        # Si el pipeline estuviera correcto, s1 == s2; actualmente falla
        # porque los emojis aportan +0.05 cada uno al score final.
        assert s1 == s2, f"got {s1} vs {s2}"

# ===== PARTE 3: PRUEBAS DE SISTEMA =====
class TestSystem:
    """Pruebas de sistema que evaluan el comportamiento global de la API REST:
    health check, validacion de entrada (longitud minima y maxima), compliance
    del esquema de respuesta y rendimiento (tiempo de respuesta < 5s)."""

    def test_PS001_api_health_check(self):
        """PS001 — Verifica que el endpoint /health responda con HTTP 200 y
        status "healthy", confirmando que el servidor FastAPI esta operativo
        y todas sus dependencias cargadas correctamente."""
        from main import app; from fastapi.testclient import TestClient
        res = TestClient(app).get("/health")
        assert res.status_code == 200
        # El campo "status" debe ser "healthy" si el sistema funciona.
        assert res.json()["status"] == "healthy"

    def test_PS002_input_validation_min_length(self):
        """PS002 — Verifica que el endpoint /analyze rechace con HTTP 422
        (Unprocessable Entity) textos con menos de 3 caracteres, cumpliendo
        la validacion de longitud minima configurada en el schema Pydantic."""
        from main import app; from fastapi.testclient import TestClient
        # "ab" tiene 2 caracteres, debe ser rechazado por el validador.
        res = TestClient(app).post("/analyze", json={"text": "ab"})
        assert res.status_code == 422

    def test_PS003_input_validation_max_length(self):
        """PS003 — Verifica que el endpoint /analyze rechace con HTTP 422
        textos que excedan la longitud maxima permitida (mas de 2000
        caracteres), protegiendo al servidor de entradas excesivamente
        grandes."""
        from main import app; from fastapi.testclient import TestClient
        # Genera un texto de ~3000 caracteres que debe exceder el limite.
        res = TestClient(app).post("/analyze", json={"text": "a " * 1500})
        assert res.status_code == 422

    def test_PS004_response_schema_compliance(self):
        """PS004 — Verifica que la respuesta JSON del endpoint /analyze
        contenga TODOS los campos obligatorios del contrato de la API:
        mood, all_moods, score, confidence, requires_help y crisis_level,
        garantizando la compatibilidad con el cliente frontend."""
        from main import app; from fastapi.testclient import TestClient
        res = TestClient(app).post("/analyze", json={"text": "Hoy me siento normal"})
        assert res.status_code == 200
        data = res.json()
        # Itera sobre los campos requeridos del esquema de respuesta.
        for field in ["mood", "all_moods", "score", "confidence", "requires_help", "crisis_level"]:
            assert field in data, f"Missing field: {field}"

    def test_PS005_performance_response_time(self):
        """PS005 — Verifica que el endpoint /analyze responda en menos de 5
        segundos para una entrada tipica. Incluye un parche que limpia
        _rate_store antes de la prueba para evitar el rate limiting acumulado
        de las 14 pruebas anteriores."""
        from main import app, _rate_store; from fastapi.testclient import TestClient
        # PATCH: Limpia el almacen de rate limiting para evitar falsos
        # rechazos por acumulacion de solicitudes de pruebas previas.
        _rate_store.clear()
        start = time.time()
        res = TestClient(app).post("/analyze", json={"text": "Hoy me siento muy bien"})
        elapsed = time.time() - start
        assert res.status_code == 200
        # El SLA de rendimiento exige respuesta en menos de 5 segundos.
        assert elapsed < 5.0, f"Tardo {elapsed:.2f}s, maximo 5s"
