# 🛠️ Reporte Técnico de Funciones - MindMood

Este documento detalla la lógica interna y las funciones principales del ecosistema MindMood.

---

## 1. Backend: Motor de Inteligencia Artificial (`ai_api/main.py`)

### `analyze_sentiment(entry: DiaryEntry)`
*   **Propósito:** Punto de entrada principal para el análisis emocional de un texto.
*   **Lógica:** 
    1.  **Limpieza:** Elimina emojis y caracteres especiales.
    2.  **Detección de Slang:** Utiliza `mexican_slang_dataset.json` para convertir expresiones como "ando al cien" en "estoy excelente".
    3.  **Análisis VADER:** Obtiene un puntaje numérico de sentimiento (`compound`).
    4.  **Búsqueda por Regex:** Escanea palabras clave exactas (`\bpalabra\b`) para asignar una de las 10 categorías emocionales.
    5.  **Priorización de Crisis:** Si detecta términos de autolesión o desesperación, ignora el puntaje positivo y marca el estado como `Crisis`.

### `get_emotions_distribution(text: str)`
*   **Propósito:** Calcula el porcentaje de cada emoción presente en un mismo texto para gráficas detalladas.

---

## 2. Aplicación Móvil (`mindmood/screens/`)

### `NewEntryScreen.js` -> `handleSave()`
*   **Función:** Gestiona el guardado de un nuevo diario.
*   **Innovación:** Implementa un **Selector de API Inteligente** que intenta conectar con el servidor local (Wi-Fi) y falla automáticamente hacia el servidor de **Render (Nube)** si el local no responde, usando un timeout de 30 segundos.

### `ProfileScreen.js` -> `scheduleNotification()`
*   **Función:** Programa recordatorios diarios.
*   **Lógica:** Solicita permisos de notificación, crea un canal en Android (`reminders`) y programa una notificación local que se repite cada 24 horas a la hora elegida por el usuario.

### `StatsScreen.js`
*   **Función:** Genera visualizaciones de bienestar.
*   **Componentes:** Utiliza `react-native-chart-kit` para dibujar la trayectoria emocional (LineChart) y la distribución mental (PieChart) del usuario.

---

## 3. Administración y Seguridad (`AdminDashboardScreen.js`)

### `fetchAdminData()`
*   **Función:** Recupera métricas globales desde Supabase usando funciones RPC (`get_admin_stats`).
*   **Lógica de Alerta:** Filtra automáticamente los diarios marcados como `Crisis` y los muestra en una bitácora de riesgo con prioridad visual.

---

## 4. Base de Datos (`supabase_setup.sql`)

### `handle_new_user()` (Trigger)
*   **Propósito:** Automatiza la creación de perfiles. Cada vez que alguien se registra, este disparador le asigna un rol (`user` o `admin`) y crea su entrada en la tabla `profiles` automáticamente.

### RLS (Row Level Security)
*   **Seguridad:** Políticas que aseguran que un usuario solo pueda leer sus propios diarios, mientras que el administrador tiene una función dedicada para ver solo los casos de riesgo.

---
**Documentación técnica generada para soporte de análisis IA.** 🦄🦾
