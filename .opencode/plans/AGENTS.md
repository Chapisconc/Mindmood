# MindMood Agent Guide

## Project Structure
```
├── ai_api/           # AI backend (FastAPI + HuggingFace)
│   ├── main.py       # Sentiment analysis + crisis detection
│   ├── requirements.txt
│   └── Procfile      # Render deployment
├── mindmood-web/     # Web app (Vite + React + TailwindCSS)
│   ├── src/
│   │   ├── pages/    # All route pages
│   │   ├── components/  # Reusable components
│   │   ├── hooks/    # useAuth, useStats, useJournalEntry
│   │   ├── services/ # Supabase, cache, contact
│   │   ├── theme/    # Dark/light themes + ThemeContext
│   │   └── i18n/     # Spanish/English translations
│   ├── .env.example
│   ├── vercel.json
│   └── vite.config.js
├── docs/             # SQL schemas + migrations
├── datasets/         # Training data for NLP
├── tests/            # Pytest tests (API)
├── render.yaml       # Render.com deployment config
└── .gitignore
```

## Quick Start

### Web App
```bash
cd mindmood-web
npm run dev          # http://localhost:5173
npm run build        # production build
npm run preview      # preview build locally
```

### AI API (local)
```bash
cd ai_api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment Variables

### Web App (`mindmood-web/.env`)
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon_key]
VITE_API_TUNNEL_URL=https://your-tunnel.trycloudflare.com
VITE_API_LOCAL_URL=http://127.0.0.1:8000
```

### AI API (`ai_api/.env`)
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_KEY=[service_role_key]
CORS_ORIGINS=https://mindmood.vercel.app,http://localhost:5173
```

## Deployment

### Frontend → Vercel
1. `cd mindmood-web`
2. `npx vercel --prod`
3. Set env var in Vercel: `VITE_API_TUNNEL_URL=https://your-tunnel.trycloudflare.com`

### Backend → Local + Cloudflare Tunnel
The HuggingFace transformer needs too much RAM for free Render tier, so the AI API runs locally.

**Prerequisites:**
1. Install cloudflared from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Create `ai_api/.env` with your Supabase credentials

**Start everything with one command:**
```powershell
.\start_local.ps1
```

This starts the API on `http://127.0.0.1:8000` and exposes it via Cloudflare Tunnel. The tunnel URL (something like `https://mindmood-api.trycloudflare.com`) is shown in the terminal — set that as `VITE_API_TUNNEL_URL` on your Vercel project.

**Or start manually:**
```bash
cd ai_api
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal:
cloudflared tunnel --url http://localhost:8000
```

## Key Architecture

### Web App
- **Stack**: Vite + React 19 + TailwindCSS v4 + React Router v7
- **Charts**: Recharts + custom shadcn-style wrappers
- **Animations**: Framer Motion
- **Auth**: Supabase (localStorage adapter)
- **PWA**: vite-plugin-pwa (service worker auto-update)

### AI API
- **Sentiment Analysis**: HuggingFace transformers pipeline
- **Crisis Detection**: Keyword-based + score threshold
- **Rate Limiting**: In-memory (10 req/60s per IP)
- **CORS**: Configurable via ALLOWED_ORIGINS env var

### Routes (Web)
| Path | Page | Auth |
|------|------|------|
| `/` | Login | No |
| `/register` | Register | No |
| `/home` | Home | Yes |
| `/new-entry` | NewEntry | Yes |
| `/history` | History | Yes |
| `/stats` | Stats | Yes |
| `/profile` | Profile | Yes |
| `/inbox` | Inbox | Yes |
| `/admin-dashboard` | AdminDashboard | Admin |

### Admin Redirect
After login, checks `profiles.role`. If "admin" → `/admin-dashboard`, else → `/home`.

## Code Conventions
- **Web**: TailwindCSS classes + inline `style` for dynamic theme colors
- **Charts**: Use `ChartContainer` wrapper from `components/ui/Chart.jsx`
- **Icons**: lucide-react (see `components/Icon.jsx` for RN→web mapping)
- **Animations**: `motion.div` with staggered delays
- **State**: React hooks + global singleton for auth (useAuth)

## Troubleshooting

### Entries not showing
- Clear localStorage in DevTools → Application → Clear storage
- Verify Supabase `entries` table has data for your user_id
- Check browser console for errors

### API returning 405 on /analyze
- Endpoint expects POST, not GET
- Check CORS: ensure web origin is in ALLOWED_ORIGINS

### Admin not redirecting
- Check `profiles.role` column exists and has value "admin"
- Default role is NULL → goes to /home

### CORS errors
- Update `ai_api/main.py` ALLOWED_ORIGINS list
- Or set `CORS_ORIGINS` env var on Render
