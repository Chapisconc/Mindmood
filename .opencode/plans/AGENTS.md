# MindMood — Diario Inteligente

## Commands

```bash
# Frontend (mindmood-web/)
npm run dev          # vite dev → http://localhost:5173
npm run build        # vite build → mindmood-web/dist/
npm run preview      # preview production build

# Root (delegates to mindmood-web/)
npm run dev
npm run build

# AI API (ai_api/)
python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Tests
python -m pytest tests/ -v                      # ISO 25010 suite
python tests/test_sentiments.py                  # manual 87-case runner
```

## Structure

├── mindmood-web/     React 19 + Vite 6 + TailwindCSS v4 + shadcn/ui (JSX, no TS)
├── ai_api/           FastAPI + HuggingFace transformers
├── tests/            pytest test suite
├── docs/sql/         Supabase schema + migrations
├── datasets/         NLP training data
├── render.yaml       Render.com deploy config
├── start_local.ps1   API local launcher

## Architecture

- **Auth**: Supabase PKCE, localStorage adapter. `profiles.role` → admin redirect.
- **Sentiment**: `pysentimiento/robertuito-sentiment-analysis` + `pysentimiento/robertuito-emotion-analysis`
- **Crisis**: keyword + regex + fuzzy matching (SequenceMatcher)
- **Rate limit**: 10 req/60s per IP (in-memory)
- **UI Library**: shadcn/ui (Radix primitives, `cn()` via `tailwind-merge` + `clsx`)
- **Dark mode**: `.dark` class on `<html>`, managed via ThemeContext. Tailwind `@custom-variant dark (&:where(.dark, .dark *));` + shadcn CSS vars
- **PWA**: vite-plugin-pwa, auto-update service worker, Workbox runtime caching
- **Icons**: lucide-react (also shadcn default icon library)
- **Animations**: framer-motion
- **Charts**: recharts

## Gotchas

- **No TypeScript** — pure JSX throughout
- **No ESLint config** — ESLint is a devDep but no `.eslintrc*` exists
- **No CI/GitHub Actions** — no `.github/` directory
- **Root lockfile empty** — real `package-lock.json` is in `mindmood-web/`
- **Root `vercel.json`** outputs `mindmood-web/dist` — Vercel config at repo root
- **AI API too heavy for Render free tier** — runs locally (`.\start_local.ps1`)
- **TailwindCSS v4** — uses `@import "tailwindcss"` (not old `@tailwind` directives)
- **shadcn/ui JSX** — project has no TypeScript. All shadcn components are in `.jsx` manually converted from `.tsx`
- **New shadcn components** — use `npx shadcn@latest add <name>`, then convert output `.tsx` → `.jsx` (remove types, change `.tsx` → `.jsx`)
- **Env files required**: `mindmood-web/.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_LOCAL_URL) and `ai_api/.env` (SUPABASE_URL, SUPABASE_KEY, CORS_ORIGINS)

## API Endpoints (ai_api)

| Path | Method | |
|------|--------|-|
| `/analyze` | POST | Main analysis → mood, score, crisis, summary |
| `/health` | GET | Health check + version |
| `/` | GET | API root + status |

## Routes (mindmood-web)

`/` → Login (public), `/register` → Register (public), `/home` → Home, `/new-entry`, `/history`, `/stats`, `/profile`, `/inbox`, `/admin-dashboard` (admin only)

## Test Structure

`tests/test_mindmood.py` organized per ISO/IEC 25010:
- Part 1: Modular (emoji removal, slang normalization, crisis, intensifiers, negation)
- Part 2: Integration (full pipeline: positive, negative, slang, crisis, emoji)
- Part 3: System (health check, input validation, schema, performance <5s)

## Deployment

- **Frontend**: `cd mindmood-web && npx vercel --prod`
- **AI API**: `.\start_local.ps1` starts uvicorn on `http://127.0.0.1:8000`
