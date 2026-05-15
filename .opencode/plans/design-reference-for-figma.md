# MindMood — Design Reference for Figma / Penpot

> URL: https://mindmood-web.vercel.app
> Stack: React + Vite + TailwindCSS + Framer Motion + Recharts + Lucide Icons

---

## 1. Design Tokens

### Theme Colors (global `themeStyles`)

| Token | Light (hex) | Dark (hex) | Uso |
|-------|------------|-----------|-----|
| `background` | `#F8FAFC` | `#020617` | Fondo de página |
| `card` | `#FFFFFF` | `#1E293B` | Cards, Sidebar, Nav |
| `text` | `#0F172A` | `#F8FAFC` | Texto principal |
| `secondaryText` | `#6366F1` | `#818CF8` | Texto secundario |
| `accent` | `#6366F1` | `#818CF8` | Acento principal (índigo) |
| `border` | `#E2E8F0` | `#334155` | Bordes y divisores |
| `error` | `#EF4444` | `#F87171` | Error / peligro |
| `success` | `#10B981` | `#34D399` | Éxito |
| `neutral` | `#F59E0B` | `#FBBF24` | Advertencia |
| `itemBg` | `#F1F5F9` | `#1E293B` | Fondo de iconos/avatars |
| `glow` | `#818CF8` | `#F472B6` | Brillo, timestamps |
| `inputBg` | `#F8FAFC` | `#0F172A` | Input fields |
| `placeholder` | `#94A3B8` | `#64748B` | Placeholder text |
| `accentGradient` (light) | `["#6366F1", "#EC4899", "#F59E0B"]` |
| `accentGradient` (dark) | `["#818CF8", "#F472B6", "#38BDF8"]` |

### Tipografía
- Font: sistema sans-serif (Tailwind default)
- Pesos: `font-semibold` (600), `font-bold` (700), `font-black` (900) — uso intensivo
- Tamaños: headings 20-28px, body 14-15px, captions 10-12px

### Border Radius
- Cards: `rounded-3xl` = 1.5rem (24px)
- Botones/items: `rounded-xl` = 0.75rem (12px), `rounded-2xl` = 1rem (16px)
- Decorativos: `rounded-lg` = 0.5rem (8px)

### Layout
| Elemento | Tamaño |
|----------|--------|
| Sidebar expandido | 260px |
| Sidebar colapsado | 72px |
| Bottom nav (mobile) | ~64px alto |
| Mobile header | 56px (h-14) |
| Contenido máx. (desktop) | 1152px (max-w-6xl) |
| Admin dashboard máx. | 896px (max-w-4xl) |
| Breakpoint lg | 1024px (sidebar aparece) |

---

## 2. Sistema de Emociones (12 estados) — CRÍTICO

Colores base de la identidad visual. Cada mood TIENE que mantener su color asignado.

| # | Mood | Hex | Icono Lucide | Score | Descripción |
|---|------|-----|-------------|-------|-------------|
| 1 | Excelente | `#10B981` | `star` | +1.0 | Plenitud total |
| 2 | Feliz | `#EC4899` | `happy-outline` | +0.7 | Bienestar y paz |
| 3 | Agradecido | `#FBBF24` | `heart-outline` | +0.5 | Gratitud profunda |
| 4 | Sorpresa | `#06B6D4` | `flash` | +0.4 | Asombro positivo |
| 5 | Neutral | `#A78BFA` | `remove-circle` | 0 | Calma estable |
| 6 | Enojo | `#F97316` | `flame` | -0.4 | Frustración |
| 7 | Ansiedad | `#8B5CF6` | `pulse-outline` | -0.5 | Inquietud persistente |
| 8 | Miedo | `#7C3AED` | `eye-off-outline` | -0.7 | Inseguridad |
| 9 | Triste | `#F43F5E` | `rainy-outline` | -0.8 | Melancolía |
| 10 | Asco | `#84CC16` | `sad-outline` | -0.9 | Rechazo |
| 11 | Crisis | `#EF4444` | `alert-circle` | -1.0 | Apoyo urgente |
| 12 | Indeterminado | `#64748B` | `help-circle` | 0 | Sentimiento ambiguo |

### EmotionModal — colores por mood (más dramáticos)

| Mood | Fondo modal | Borde | Círculo icono |
|------|------------|-------|--------------|
| Excelente | `#064E3B` | `#10B981` | `#10B981` |
| Feliz | `#4C1D95` | `#EC4899` | `#EC4899` |
| Agradecido | `#1A3A1A` | `#FBBF24` | `#FBBF24` |
| Sorpresa | `#083344` | `#06B6D4` | `#06B6D4` |
| Neutral | `#2E1065` | `#A78BFA` | `#A78BFA` |
| Enojo | `#431407` | `#F97316` | `#F97316` |
| Ansiedad | `#1E1B4B` | `#8B5CF6` | `#8B5CF6` |
| Miedo | `#2E1065` | `#7C3AED` | `#7C3AED` |
| Triste | `#4C0519` | `#F43F5E` | `#F43F5E` |
| Asco | `#1A2E05` | `#84CC16` | `#84CC16` |
| Crisis | `#180808` | `#EF4444` | `#EF4444` |
| Indeterminado | `#1E293B` | `#64748B` | `#64748B` |

---

## 3. Arquitectura de Layout

```
Desktop (≥1024px)               Mobile (<1024px)
┌──────────┬──────────────┐     ┌──────────────┐
│ Sidebar  │   Content    │     │  MobileHeader │
│ (260⇄72) │  max-w-6xl   │     ├──────────────┤
│          │  mx-auto      │     │   Content    │
│ Nav items│  <Routes/>    │     │     (pb-20)  │
│ Admin    │              │     │              │
│ ──────── │              │     │              │
│ Avatar   │              │     ├──────────────┤
│ Profile  │              │     │  Bottom Nav  │
└──────────┴──────────────┘     └──────────────┘
```

### Navegación Bottom Nav (mobile)
- Inicio (`Home`) · Nueva Entrada (`PlusCircle`) · Historial (`BookOpen`) · Estadísticas (`TrendingUp`) · Admin (solo admins, `Shield`) · Perfil (`UserCircle`)

### Sidebar (desktop)
- Logo "M" badge + "MindMood" + botón colapsar (ChevronRight gira 180°)
- Nav items con icono 40x40 + label + barra activa (w-1.5 h-8 rounded-full)
- Al final: avatar + nombre + email del usuario

### Rutas
| Ruta | Componente | Protegida |
|------|-----------|-----------|
| `/` | Login | No |
| `/register` | Register | No |
| `/home` | HomePage | Sí |
| `/new-entry` | NewEntry | Sí |
| `/history` | History | Sí |
| `/stats` | Stats | Sí |
| `/inbox` | Inbox | Sí |
| `/profile` | Profile | Sí |
| `/admin-dashboard` | AdminDashboard | Sí (admin) |

---

## 4. Inventario por Página

### 4.1 Login (`/`)
- Card centrada con badge "M" gradiente + inputs email/password
- Botón "Iniciar Sesión" con gradient accent
- Link "Crear cuenta"

### 4.2 Register (`/register`)
- Mismo layout que Login
- Email + Password + Confirmar password

### 4.3 Home (`/home`)
- **Streak**: 🔥 + número de días consecutivos
- **Grilla de emociones**: 2 columnas × 6 filas. Cada card = círculo con color de emoción + nombre. Tap → NewEntry con ese mood preseleccionado
- **Stats row**: 2 cards — "Registros hoy" + "Racha actual"
- **Resumen semanal**: mini gráfico de moods recientes por día

### 4.4 NewEntry (`/new-entry`)
- **Selector de mood**: scroll horizontal con 12 círculos de emoción + nombre
- **Textarea**: input multilínea para el diario
- **Botón enviar**: grande, gradiente, ancho completo
- **Loading**: spinner overlay mientras analiza la IA
- Al guardar → abre EmotionModal

### 4.5 EmotionModal (overlay post-entry)
- Círculo grande con color de emoción + icono Lucide
- Título del mood + frase poética (cambia cada día del año)
- **Barras de distribución horizontal**: nombre (80px) + barra coloreada (rounded) + porcentaje (a la derecha)
- Línea divisoria
- Texto de resumen de IA
- **Si es Crisis**: 3 botones de líneas de ayuda (Cero Suicidios 075, Línea de la Vida 800-911-2000, SAPTEL 55-5603-0000) + botón rojo "Entendido"
- **Si es normal**: botón "Cerrar" con color del mood

### 4.6 History (`/history`)
- **Filtro**: chips/botones de mood para filtrar por emoción
- **Timeline**: cards scrollables. Cada card: fecha+hora + mood (color dot + nombre) + preview texto (2 líneas truncado)
- Tap → detalle completo

### 4.7 Stats (`/stats`)
- Back button (ArrowLeft)
- **Racha**: 🔥 + número
- **Gráfico radial/pie** de distribución emocional dominante
- **Calendario** (opcional): marca días con entradas
- **Desglose**: lista/barras de cada mood con count y %

### 4.8 Inbox (`/inbox`)
- Lista de contact requests del admin al usuario
- Cada card: mensaje del admin, status (accepted/pending/rejected), timestamp
- Botones Aceptar/Rechazar si está pending

### 4.9 Profile (`/profile`)
- Avatar (inicial en círculo)
- Display name + email
- Theme toggle (light/dark)
- Stats: total entries, streak, mood actual
- Logout button

### 4.10 AdminDashboard (`/admin-dashboard`)
**Solo usuarios con role=admin**

**Header**: "Panel Admin" + back button + logout

**KPI Row** (2 cards): Usuarios (icono verde) + Diarios (icono rosa)

**Chart Section** (Recharts):
1. **Distribución Emocional** — Donut (inner 60, outer 90) + toggle RadarChart
2. **Crisis vs Normal** — Donut pequeño (inner 30, outer 50)
3. **Estado Alarmas** — Donut pequeño (Active/Working/Resolved)
4. **Barras por Emoción** — BarChart horizontal con barras coloreadas
5. **Top Crisis** — Top 5 usuarios con más crisis

**Filtros**: Todos / Pendientes / En Proceso / Contactados

**Buscador**: input con icono Search

**Lista de alarmas**: cada card muestra:
- Email + timestamp (fecha · hora)
- Status pill (Pendiente=rojo, En Proceso=amarillo, Resuelto=verde) — click cambia estado
- Contact badge (verde "✓ Contactado" o rojo "✗ Rechazado")
- Texto del diario (2 líneas)
- Mood name (coloreado)
- Botón "Contactar →" (solo si no hay contact request aún)

**Report button**: "📋 Copiar Reporte" (copia stats al portapapeles)

---

## 5. Patrones de Animación

- **Transiciones de página**: fade + slide up (y: 8→0, opacity: 0→1, 200ms)
- **Sidebar**: spring animation en width (260⇄72)
- **Menú mobile**: slide desde izquierda con spring (damping 25, stiffness 200)
- **Cards**: aparecen con stagger delay (`delay: i * 0.03`)
- **Hover**: `transition-all duration-200`, `hover:opacity-70`
- **Loading**: spinner doble (2 anillos, direcciones opuestas)

---

## 6. Chart Library

Usamos **Recharts**. Componentes activos:

- `<PieChart>` + `<Pie>` + `<Cell>` — donuts con `innerRadius`/`outerRadius`
- `<RadarChart>` — componente custom (no Recharts)
- `<BarChart>` + `<Bar>` + `<XAxis>` + `<YAxis>` — layout vertical para emotion bars
- `<Tooltip>` — tooltips con estilo theme.card + border
- `<ResponsiveContainer>` — todos los charts envueltos en este para responsiveness

---

## 7. Lo Que Necesitamos Diseñado (Prioridad)

1. **Desktop sidebar** — expandido + colapsado, active indicators, profile footer
2. **Home page** — streak hero, mood grid (6×2), week summary, quick stats
3. **NewEntry** — mood selector scroll, textarea, send button
4. **EmotionModal** — overlay con barras + frase + variante crisis
5. **AdminDashboard** — KPI row, charts layout, filters, alarm cards
6. **Stats** — charts, calendar, breakdown
7. **History** — filter chips + card timeline
8. **Inbox** — contact request cards + accept/reject
9. **Profile** — avatar, stats, theme toggle, logout
10. **Login/Register** — centered card con branding

---

> **⚠️ IMPORTANTE**: Usar los HEX exactos de las secciones 1 y 2. Los colores de emoción son la identidad de marca — cada mood DEBE mantener su color asignado. Definir variables de color en Figma que coincidan 1:1 con estos tokens para que el handoff a dev sea pixel-perfect.
