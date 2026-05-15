# MindMood — Diario Emocional Inteligente

**Diario personal con inteligencia artificial** que analiza tus emociones en español mexicano coloquial usando modelos HuggingFace (Robertuito). Detecta crisis, normaliza jerga mexicana, y te ayuda a dar seguimiento a tu salud emocional.

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite 6 + TailwindCSS v4)  │  PWA con Service Worker
│  9 páginas | 15+ componentes | shadcn/ui        │
├─────────────────────────────────────────────────┤
│  Backend (FastAPI + Uvicorn)                    │  ngrok / Vercel
│  Pipeline IA 10 etapas | 2 Modelos HuggingFace  │
│  Rate Limiter | Crisis Detection 3 capas        │
├─────────────────────────────────────────────────┤
│  Base de Datos (Supabase PostgreSQL)            │
│  3 tablas | 12 funciones RPC | RLS | Auth JWT   │
└─────────────────────────────────────────────────┘
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 6, TailwindCSS v4, shadcn/ui, Framer Motion, Recharts |
| Backend | FastAPI, Uvicorn, HuggingFace Transformers, pysentimiento/robertuito |
| Base de Datos | Supabase PostgreSQL, Row Level Security, JWT + PKCE |
| Testing | pytest, 15 casos ISO/IEC 25010:2023 |
| Deploy | Vercel (frontend), ngrok (backend tunnel) |

## Pipeline de IA (10 etapas)

1. **Recepción** — `POST /analyze`
2. **Limpieza** — Eliminación de emojis
3. **Normalización** — 70+ expresiones de jerga mexicana
4. **Sentiment Analysis** — Robertuito POS/NEG/NEU
5. **Refuerzo Emocional** — Intensificadores + mayúsculas
6. **Detección de Crisis** — Keywords + fuzzy + regex (3 capas)
7. **Emotion Analysis** — Robertuito 7 categorías → 12 emociones
8. **Keyword Reinforcement** — 200+ palabras clave
9. **Cálculo de Confianza** — Score -1.0 a +1.0
10. **Resumen Empático** — Texto personalizado

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/analyze` | Analiza texto y devuelve mood, score, emotions, requires_help, crisis_level |
| `GET` | `/health` | Health check del servicio |
| `GET` | `/` | Información de la API |

## Pruebas

**15 casos de prueba ISO/IEC 25010:2023** — 14 passed, 1 xfail (93.3%)

- **5 Modulares**: emoji removal, slang normalization, crisis detection, intensifiers, negation
- **5 Integración**: pipeline positivo/negativo, slang, crisis, emoji ordering (xfail)
- **5 Sistema**: health check, input validation, response schema, performance <5s

Ejecutar: `python -m pytest tests/ -v`

## Instalación Local

### Backend
```bash
cd ai_api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd mindmood-web
npm install
npm run dev
```

### Variables de Entorno
Crear `mindmood-web/.env`:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_API_LOCAL_URL=http://127.0.0.1:8000
```

## Estructura del Proyecto

```
├── ai_api/                 # Backend FastAPI
│   ├── main.py             # Pipeline IA (1106 líneas)
│   ├── mexican_slang_dataset.json
│   └── requirements.txt
├── mindmood-web/           # Frontend React + Vite
│   └── src/
│       ├── pages/          # 9 páginas
│       ├── components/     # 15+ componentes
│       ├── hooks/          # useAuth, useJournalEntry, useStats
│       ├── services/       # Supabase, cache, contact
│       ├── theme/          # Tema claro/oscuro
│       └── i18n/           # Traducciones ES/EN
├── tests/                  # 15 pruebas pytest
│   ├── test_mindmood.py
│   └── run_all_tests.py
├── docx_utils.py           # Utilidades generación documentos Word
├── generate_final.py       # Generador de documentos académicos
└── docs/sql/               # Migraciones SQL
```

## Autor

**RAMIREZ RUIZ, CRISTOPHER SAID**  
Seminario de Ingeniería de Software — Sección D15  
CUCEI — Universidad de Guadalajara  
Mayo 2026

## Licencia

MIT License — Ver [LICENSE](LICENSE)
