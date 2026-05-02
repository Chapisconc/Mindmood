# MindMood: Diario Personal Inteligente

Plataforma de bienestar emocional con **IA Local**. Incluye aplicación móvil (React Native), aplicación web (Vite + React) y un backend de análisis de sentimientos con **Python FastAPI (VADER)**. Soportado por **Supabase** para Base de Datos y Autenticación.

## 📱 Tecnologías

*   **Frontend Móvil**: React Native, Expo, React Navigation
*   **Frontend Web**: React, Vite, Tailwind CSS, Recharts
*   **Backend de IA**: Python, FastAPI, uvicorn, `vaderSentiment`, `deep-translator`
*   **BaaS**: Supabase (PostgreSQL, Auth)

## 🚀 Despliegue Local

Para ejecutar el proyecto completamente, necesitas arrancar tanto el Backend de IA como el Frontend (Móvil o Web).

### 1️⃣ Arrancar la Inteligencia Artificial (Backend Local)
En tu terminal:
```bash
cd ai_api
# Opcional: activar entorno virtual si lo usas
# venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2️⃣ Arrancar la Aplicación Web (React/Vite)
En una nueva ventana de terminal:
```bash
cd mindmood_web
npm install
npm run dev
```
Abre `http://localhost:5173` en tu navegador.

### 3️⃣ Arrancar la Aplicación Móvil (React Native / Expo)
En una nueva ventana de terminal:
```bash
cd mindmood
npm install
npx expo start
```
Con Expo Go en tu celular, escanea el código QR para visualizar la app.

## 🧪 Pruebas (Tests ISO 25010/29119)
El proyecto cuenta con 15 casos de prueba (Modulares, Integración y Sistema) optimizados.
Para ejecutarlos, usa en la raíz del proyecto:
```bash
pip install pytest httpx
python -m pytest tests/test_mindmood.py -v
```

## 🔒 Privacidad y Roles
*   Los datos se almacenan encriptados en Supabase.
*   **Usuario Admin**: Si te registras con el correo `c@c.com`, obtendrás el rol `admin` automáticamente (gracias al trigger en Supabase) y podrás acceder al panel de administración global desde la web.
