"""
Casos de Prueba — MindMood
Norma: ISO/IEC 25010:2023 (Calidad de producto de software)
       ISO/IEC 29119-3:2022 (Documentación de pruebas)

Ejecutar: python -m pytest tests/ -v
"""
import pytest
import json
import re
import os
import sys

# Agregar el directorio padre al path para importar módulos
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai_api'))


# ============================================================================
# PARTE 1: PRUEBAS MODULARES (Unitarias) — ISO 25010: Adecuación Funcional
# Verifican que cada componente individual funciona correctamente de forma
# aislada, sin dependencias externas.
# ============================================================================

class TestModular:
    """PM-001 a PM-005: Pruebas modulares/unitarias del motor de análisis."""

    def test_PM001_emoji_removal(self):
        """PM-001: Validar que los emojis son eliminados del texto de entrada.
        Criterio ISO 25010: Corrección funcional.
        """
        import emoji
        text_with_emojis = "Hoy estoy feliz 😊🎉 y contento 🥳"
        cleaned = emoji.replace_emoji(text_with_emojis, replace='')
        assert "😊" not in cleaned
        assert "🎉" not in cleaned
        assert "🥳" not in cleaned
        assert "Hoy estoy feliz" in cleaned
        assert "y contento" in cleaned

    def test_PM002_mexican_slang_normalization(self):
        """PM-002: Validar que la jerga mexicana se normaliza correctamente.
        Criterio ISO 25010: Corrección funcional.
        """
        dataset_path = os.path.join(os.path.dirname(__file__), '..', 'ai_api', 'mexican_slang_dataset.json')
        with open(dataset_path, 'r', encoding='utf-8') as f:
            slang = json.load(f)
        
        # Verificar que el dataset tiene entradas
        assert len(slang) > 20, "El dataset debe tener al menos 20 entradas"
        # Verificar que 'chido' se normaliza
        assert "chido" in slang
        assert slang["chido"] == "excelente"
        # Verificar que 'aguitado' existe
        assert "aguitado" in slang

    def test_PM003_crisis_keywords_detection(self):
        """PM-003: Validar detección de palabras clave de crisis.
        Criterio ISO 25010: Fiabilidad — Madurez.
        """
        from main import has_crisis_indicators
        
        assert has_crisis_indicators("me quiero morir") == True
        assert has_crisis_indicators("ya no quiero vivir") == True
        assert has_crisis_indicators("hoy fue un buen día") == False
        assert has_crisis_indicators("estoy contento con mi vida") == False

    def test_PM004_intensifier_multiplier(self):
        """PM-004: Validar que los intensificadores aumentan la puntuación.
        Criterio ISO 25010: Corrección funcional.
        """
        from main import get_intensifier_multiplier
        
        assert get_intensifier_multiplier("muy feliz") > 1.0
        assert get_intensifier_multiplier("extremadamente triste") > 1.0
        assert get_intensifier_multiplier("algo normal") == 1.0
        # Verificar que no excede el tope
        assert get_intensifier_multiplier("muy extremadamente super") <= 1.5

    def test_PM005_negation_detection(self):
        """PM-005: Validar detección de negaciones en el texto.
        Criterio ISO 25010: Corrección funcional.
        """
        from main import detect_negation
        
        assert detect_negation("no estoy bien") == True
        assert detect_negation("nunca me sentí así") == True
        assert detect_negation("estoy bien") == False


# ============================================================================
# PARTE 2: PRUEBAS DE INTEGRACIÓN — ISO 25010: Compatibilidad / Interoperabilidad
# Verifican que los componentes trabajan correctamente juntos.
# ============================================================================

class TestIntegration:
    """PI-001 a PI-005: Pruebas de integración del pipeline de análisis."""

    def test_PI001_full_analysis_pipeline_positive(self):
        """PI-001: Pipeline completo de análisis con texto positivo.
        Verifica: normalización → traducción → VADER → clasificación.
        Criterio ISO 25010: Interoperabilidad.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.post("/analyze", json={"text": "Hoy fue un día maravilloso, me siento muy feliz", "language": "es"})
        assert response.status_code == 200
        data = response.json()
        assert data["score"] > 0
        assert data["mood"] in ["Feliz", "Excelente", "Agradecido"]
        assert data["requires_help"] == False

    def test_PI002_full_analysis_pipeline_negative(self):
        """PI-002: Pipeline completo de análisis con texto negativo.
        Criterio ISO 25010: Interoperabilidad.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.post("/analyze", json={"text": "Estoy muy triste y deprimido, todo va mal", "language": "es"})
        assert response.status_code == 200
        data = response.json()
        assert data["score"] < 0
        assert data["requires_help"] == False or data["mood"] in ["Triste", "Crisis"]

    def test_PI003_slang_to_analysis_integration(self):
        """PI-003: Integración de jerga mexicana con análisis de sentimiento.
        Criterio ISO 25010: Corrección funcional + Interoperabilidad.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.post("/analyze", json={"text": "Estoy bien aguitado, todo está chafa", "language": "es"})
        assert response.status_code == 200
        data = response.json()
        assert data["score"] < 0, "La jerga negativa debe producir score negativo"

    def test_PI004_crisis_detection_integration(self):
        """PI-004: Integración de detección de crisis con respuesta completa.
        Criterio ISO 25010: Fiabilidad — Tolerancia a fallos.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.post("/analyze", json={"text": "Ya no quiero vivir, quiero desaparecer", "language": "es"})
        assert response.status_code == 200
        data = response.json()
        assert data["requires_help"] == True
        assert data["crisis_level"] == "critical"

    def test_PI005_emoji_stripped_before_analysis(self):
        """PI-005: Los emojis se eliminan antes del análisis, no afectan el score.
        Criterio ISO 25010: Corrección funcional.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        r1 = client.post("/analyze", json={"text": "Estoy bien", "language": "es"})
        r2 = client.post("/analyze", json={"text": "Estoy bien 😊😊😊🎉🎉", "language": "es"})
        assert r1.status_code == 200
        assert r2.status_code == 200
        # Los scores deben ser iguales porque los emojis se eliminan
        assert r1.json()["score"] == r2.json()["score"]


# ============================================================================
# PARTE 3: PRUEBAS DE SISTEMA — ISO 25010: Eficiencia de Desempeño / Seguridad
# Verifican el sistema completo desde la perspectiva del usuario final.
# ============================================================================

class TestSystem:
    """PS-001 a PS-005: Pruebas de sistema end-to-end."""

    def test_PS001_api_health_check(self):
        """PS-001: Verificar que el sistema responde al health check.
        Criterio ISO 25010: Disponibilidad.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "sentiment_analysis" in data["features"]

    def test_PS002_input_validation_min_length(self):
        """PS-002: Validar que textos muy cortos son rechazados.
        Criterio ISO 25010: Seguridad — Integridad.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.post("/analyze", json={"text": "ab", "language": "es"})
        assert response.status_code == 422, "Textos < 3 caracteres deben ser rechazados"

    def test_PS003_input_validation_max_length(self):
        """PS-003: Validar que textos excesivamente largos son rechazados.
        Criterio ISO 25010: Eficiencia de desempeño — Utilización de recursos.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        long_text = "a " * 1500  # > 2000 caracteres
        response = client.post("/analyze", json={"text": long_text, "language": "es"})
        assert response.status_code == 422, "Textos > 2000 caracteres deben ser rechazados"

    def test_PS004_response_schema_compliance(self):
        """PS-004: Verificar que la respuesta cumple con el esquema definido.
        Criterio ISO 25010: Corrección funcional.
        """
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.post("/analyze", json={"text": "Hoy me siento normal", "language": "es"})
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["mood", "all_moods", "emotions_distribution", "score", "confidence", "summary", "requires_help", "crisis_level"]
        for field in required_fields:
            assert field in data, f"Campo requerido '{field}' falta en la respuesta"
        
        assert isinstance(data["score"], (int, float))
        assert -1.0 <= data["score"] <= 1.0
        assert isinstance(data["confidence"], (int, float))
        assert 0.0 <= data["confidence"] <= 1.0
        assert isinstance(data["requires_help"], bool)

    def test_PS005_performance_response_time(self):
        """PS-005: Verificar que el análisis responde en tiempo aceptable.
        Criterio ISO 25010: Eficiencia de desempeño — Comportamiento temporal.
        Umbral: < 5 segundos por solicitud.
        """
        import time
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        start = time.time()
        response = client.post("/analyze", json={"text": "Hoy me siento muy bien y contento con mi trabajo", "language": "es"})
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 5.0, f"La respuesta tardó {elapsed:.2f}s, excede el umbral de 5s"
