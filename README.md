# 🦄 MindMood — Diario Personal Inteligente con IA

MindMood es una plataforma de bienestar emocional de nivel producción que combina un diario móvil nativo con un motor de análisis de sentimientos avanzado (NLP). Detecta matices complejos como crisis emocionales y ofrece seguimiento administrativo detallado.

## 📁 Estructura del Proyecto "Unicornio"

Para mantener la máxima eficiencia y orden, el proyecto se organiza de la siguiente manera:

*   **`mindmood/`**: 📱 Aplicación móvil nativa (Expo SDK 51). Interfaz premium con modo oscuro, gráficas animadas y sistema de diseño EDS.
*   **`ai_api/`**: 🧠 Motor de IA (FastAPI + Robertuito). Procesa el lenguaje natural y detecta estados de crisis.
*   **`docs/`**: 📄 Documentación técnica completa.
    *   `architecture.md`: Diseño del sistema y flujo de datos.
    *   `sql/`: Migraciones y esquemas de base de datos (Supabase).
    *   `guides/`: Estándares de UI, testing y mejores prácticas.
    *   `test_cases.txt`: Plan de pruebas detallado (Modular, Integración, Sistema).
*   **`tests/`**: 🧪 Suite de pruebas automatizadas (Maestro para móvil y Pytest para backend).
*   **`datasets/`**: 📊 Diccionarios y datos de entrenamiento para el NLP.

## 🚀 Guía de Inicio Rápido

### 1️⃣ Iniciar el Motor de IA
```bash
cd ai_api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2️⃣ Iniciar la App Móvil
```bash
cd mindmood
npm install
npx expo start
```

## 🛡️ Infraestructura y Seguridad
El proyecto utiliza **Supabase** como BaaS con políticas RLS (Row Level Security) y funciones RPC para el panel administrativo. Asegúrate de ejecutar los scripts en `docs/sql/` para activar todas las funcionalidades.

---
**Proyecto optimizado y auditado para calidad de software (ISO 25010).**
