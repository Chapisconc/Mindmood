# MindMood — Guía de Inicio y Despliegue

## Requisitos
- Node.js 18+
- Python 3.10+
- Supabase project (https://supabase.com)

## 1. Frontend (React + Vite)

```bash
cd mindmood-web
npm install
npm run dev          # http://localhost:5173
npm run build        # build producción → mindmood-web/dist/
npx vercel --prod    # deploy a Vercel
```

Variables de entorno (`mindmood-web/.env`):
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_API_NGROK_URL=                     # opcional: URL de ngrok
VITE_API_LOCAL_URL=http://127.0.0.1:8000
```

## 2. Backend IA (FastAPI + HuggingFace)

```bash
cd ai_api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

El backend se conecta a Supabase para leer datos de usuarios. Variables (`ai_api/.env`):
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
CORS_ORIGINS=http://localhost:5173,https://mindmood-web.vercel.app
```

## 3. Exponer el API públicamente (para que Vercel lo use)

### Opción A — ngrok (recomendada)
```bash
# Una terminal:
cd ai_api && uvicorn main:app --host 0.0.0.0 --port 8000

# Otra terminal:
ngrok http 8000
# Copiar la URL https://xxx.ngrok-free.dev
```

En Vercel: `vercel env add VITE_API_NGROK_URL` y pegar la URL.

### Opción B — Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:8000 --protocol http2
```

### Opción C — Desplegar en Render
Requiere upgrade de plan (los modelos ocupan ~2GB RAM).

## 4. Base de Datos (Supabase)

Ejecutar en Supabase SQL Editor los archivos de `docs/sql/`:
1. `001_full_schema.sql` — tablas, funciones, RLS
2. `003_fix_rls_and_functions.sql` — correcciones de RLS

## 5. Tests

```bash
python -m pytest tests/ -v                    # 15 pruebas automatizadas
python tests/test_sentiments.py               # 87 casos manuales
```

## 6. Documentación

```bash
pip install python-docx matplotlib
python generate_oficial.py                    # genera MindMood_Documentacion_Oficial.docx
```

## Archivos importantes

| Archivo | Propósito |
|---------|-----------|
| `mindmood-web/` | Frontend React + Vite + TailwindCSS |
| `ai_api/main.py` | API FastAPI con análisis de sentimiento |
| `docs/sql/` | Esquemas y migraciones de Supabase |
| `tests/` | Pruebas del backend |
| `docx_utils.py` | Generación de documentos Word avanzados |
| `generate_oficial.py` | Genera la documentación oficial del proyecto |
| `start_local.ps1` | Inicia el servidor local |
