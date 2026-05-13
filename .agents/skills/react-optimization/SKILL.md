# React Optimization Best Practices

## Evitar Redundancias y Optimizar Tokens

### 1. Lazy Loading de Páginas
**Problema:** El bundle inicial carga todas las páginas aunque el usuario solo acceda a Login.
**Solución:** Usar `React.lazy()` para code splitting.

```jsx
// App.jsx - IMPORTS
import { lazy, Suspense } from "react";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const Stats = lazy(() => import("./pages/Stats"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
// ... otras páginas

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0F0A1E" }}>
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#8B5CF640", borderTopColor: "#8B5CF6" }} />
    </div>
  );
}

// Usage
<Suspense fallback={<LoadingFallback />}>
  <Routes>
    <Route path="/" element={<Login />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 2. NO hacer queries duplicadas en Contextos
**Problema:** ThemeContext e I18nContext hacen queries independientes a `profiles` para obtener theme/lang, cuando YA tienen esos datos en `useAuth().profile`.
**Solución:** Consumir del perfil que ya proporciona useAuth.

```jsx
// ThemeContext.jsx - ANTES (MALO)
useEffect(() => {
  const unsubscribe = subscribeToSession(async (session) => {
    if (session?.user) {
      const { data } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", session.user.id)
        .single();
      // ...
    }
  });
}, []);

// ThemeContext.jsx - DESPUÉS (OPTIMIZADO)
const { profile } = useAuth();

useEffect(() => {
  if (profile?.theme) {
    setTheme(profile.theme);
  }
}, [profile?.theme]);
```

### 3. Centralizar Funciones Utilitarias
**Problema:** La lógica de streak estaba duplicada en 3 lugares (useJournalEntry.js, NewEntry.jsx, useAuth.js).
**Solución:** Crear un hook que exponga la función y usarla en todos los componentes.

```jsx
// hooks/useJournalEntry.js - EXPORTAR updateStreak
const updateStreak = useCallback(async (userId) => {
  // lógica centralizada
}, []);

return { saveEntry, getEntries, loading, updateStreak };

// NewEntry.jsx - USAR el hook
const { updateStreak } = useJournalEntry();
await updateStreak(user.id);
```

### 4. PWA Cache Config
**Problema:** No había estrategia de cache para imágenes ni API calls.
**Solución:** Agregar runtimeCaching en vite.config.js.

```javascript
// vite.config.js
VitePWA({
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg)/,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
        }
      },
      {
        urlPattern: /\/analyze/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10
        }
      }
    ]
  }
})
```

### 5. Reglas de Código

| Regla | Descripción |
|-------|-------------|
| **UNA sola fuente de verdad** | Si un dato viene de useAuth (profile), NO hacer otra query para obtenerlo |
| **Hooks para lógica reutilizable** | Cualquier función usada en +1 lugar debe estar en un hook |
| **Lazy loading obligatorio** | Todas las páginas (excepto Login/Register) deben ser lazy loaded |
| **PWA config completa** | Siempre incluir runtimeCaching para imágenes y API |
| **Sin prop-drilling** | Usar contexto o hooks en lugar de pasar props profundas |

### Check-list de Revisión
- [ ] ¿Se usa lazy loading en App.jsx?
- [ ] ¿Los contextos consumen datos de useAuth en lugar de hacer queries?
- [ ] ¿Hay funciones duplicadas que pueden centralizarse en un hook?
- [ ] ¿El PWA tiene runtimeCaching configurado?
- [ ] ¿El bundle inicial está por debajo de 300KB?