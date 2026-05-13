# Vite + React Web Patterns

## Purpose
Patrones y convenciones para el proyecto MindMood web (Vite + React + TailwindCSS + React Router).

## Project Structure

```
src/
├── main.jsx              # Entry: ReactDOM.createRoot, register service worker
├── App.jsx               # Providers + Router definition
├── index.css             # Tailwind directives, CSS variables, global styles
├── pages/                # Route-level page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Home.jsx
│   ├── NewEntry.jsx
│   ├── History.jsx
│   ├── Stats.jsx
│   ├── Profile.jsx
│   ├── AdminDashboard.jsx
│   └── Inbox.jsx
├── components/           # Reusable UI components
│   ├── AppButton.jsx
│   ├── EmotionModal.jsx
│   ├── StreakModal.jsx
│   ├── StreakCalendarModal.jsx
│   ├── NoticeModal.jsx
│   ├── ContactInfoModal.jsx
│   ├── Icon.jsx
│   ├── RadarChart.jsx
│   └── ErrorBoundary.jsx
├── hooks/                # Custom React hooks (copied from RN)
│   ├── useAuth.js
│   ├── useJournalEntry.js
│   └── useStats.js
├── services/             # API services (copied from RN)
│   ├── supabase.js
│   ├── contactService.js
│   └── cache.js
├── theme/                # Theme system (copied/adapted from RN)
│   ├── ThemeContext.jsx
│   ├── themes.js
│   ├── emotions.js
│   └── spacing.js
└── i18n/                 # i18n (copied/adapted from RN)
    ├── I18nContext.jsx
    └── translations.js
```

## Coding Conventions

### Imports Order
1. React / React Router
2. Third-party libraries (supabase, recharts, framer-motion, lucide-react)
3. Custom hooks
4. Services
5. Theme / i18n
6. Components

### Component Pattern
```jsx
import { useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { motion } from "framer-motion";

export default function ComponentName() {
  const navigate = useNavigate();
  const { theme, themeStyles } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* content */}
    </motion.div>
  );
}
```

### Styling
- Use TailwindCSS utility classes primarily
- Use inline `style={{ color: themeStyles.text }}` for dynamic theme values
- Use `cn()` utility (from clsx) for conditional classes
- Avoid CSS modules or styled-components unless Tailwind can't handle it

```jsx
import { cn } from "../lib/utils"; // if needed

<div className={cn("p-4 rounded-2xl", isActive && "bg-accent")}>
```

### Theme Application
Theme variables from ThemeContext go via inline style for dynamic values:
```jsx
<div style={{ backgroundColor: themeStyles.card, color: themeStyles.text }}>
```
Or use CSS custom properties set on root:
```css
:root { --bg: #FAF5FF; --text: #2D1B69; }
.dark { --bg: #0F0A1E; --text: #F8FAFC; }
```

### Routing
```jsx
// App.jsx
<Routes>
  <Route path="/" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/home" element={<Home />} />
  <Route path="/new-entry" element={<NewEntry />} />
  <Route path="/history" element={<History />} />
  <Route path="/stats" element={<Stats />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/inbox" element={<Inbox />} />
</Routes>
```

### Error Handling
- Wrap app in ErrorBoundary
- Use try/catch in async handlers
- Show user-friendly messages via NoticeModal
- Log to console only in dev (`import.meta.env.DEV`)

### Online/Offline Detection
```jsx
const [isOnline, setIsOnline] = useState(navigator.onLine);
useEffect(() => {
  const goOnline = () => setIsOnline(true);
  const goOffline = () => setIsOnline(false);
  window.addEventListener("online", goOnline);
  window.addEventListener("offline", goOffline);
  return () => {
    window.removeEventListener("online", goOnline);
    window.removeEventListener("offline", goOffline);
  };
}, []);
```

### API Calls
```jsx
const NGROK_URL = import.meta.env.VITE_API_NGROK_URL;
const LOCAL_URL = "http://127.0.0.1:8000/analyze";
```

## Dependencies
- react, react-dom
- react-router-dom (v7+)
- @supabase/supabase-js
- recharts
- framer-motion
- lucide-react
- clsx
- vite-plugin-pwa (for PWA)

## Vite Config
```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

## Deployment (Vercel)
Create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
