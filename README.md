# 🧠 MindMood — Diario Personal Inteligente con IA

MindMood es una plataforma de bienestar emocional que combina un diario personal con un motor de análisis de sentimientos avanzado (NLP). Detecta matices complejos como sarcasmo, estrés laboral y alertas de crisis, ofreciendo reflexiones psicológicas personalizadas.

## 🛠️ Stack Tecnológico

* **IA Backend:** Python (FastAPI + NLTK/VADER + Google Translate API).
* **Web:** React + Vite + Tailwind CSS + Framer Motion.
* **Móvil:** React Native + Expo (vía `/mindmood`).
* **BaaS:** Supabase (Auth, RLS, RPCs para métricas y alertas).

## 🚀 Guía de Inicio Rápido

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

## 🛡️ Configuración de Seguridad y Base de Datos

El proyecto utiliza Supabase. Asegúrate de:
1. Configurar tus variables de entorno en `.env` y `mindmood_web/.env.local`.
2. Ejecutar los scripts SQL de `supabase_setup.sql` y `migration_resolve_entries.sql` en tu Dashboard de Supabase para activar las métricas y el panel administrativo.

## 📄 Normativas Implementadas
* **ISO 25010:** Calidad de producto de software.
* **ISO 27001:** Gestión de seguridad de la información.
