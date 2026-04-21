# MindMood: Diario Personal Inteligente

Aplicación móvil desarrollada en **React Native (Expo)** con IA Local. Incluye funciones de análisis de sentimiento mediante **Python FastAPI (VADER)** y Base de Datos/Auth soportado por **Supabase**.

## 📱 Tecnologías

*   **Frontend**: React Native, Expo, React Navigation
*   **Backend de IA**: Python, FastAPI, uvicorn, `vaderSentiment`
*   **BaaS**: Supabase (Database, Auth)
*   **Visualización**: `react-native-chart-kit`

## 🚀 Despliegue Local

### 1️⃣ Arrancar la Intelegencia Artificial (Backend Local)
En tu terminal:
```bash
cd ai_api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2️⃣ Arrancar la Aplicación Móvil (React Native)
En una nueva ventana de terminal:
```bash
cd mindmood
npx expo start
```
Con Expo Go en tu celular, escanea el código para visualizar o compilar nativo.
