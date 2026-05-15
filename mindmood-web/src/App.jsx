/* ==========================================================================
   App.jsx — COMPONENTE RAÍZ de MindMood
   Configura los proveedores globales (tema, i18n, errores),
   el enrutamiento por lazy-loading y el sistema de notificaciones toast.
   Renderiza Login, Register o Layout según la ruta.
   ========================================================================== */

// React: lazy loading y Suspense para división de código por ruta
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Proveedores globales de tema oscuro/claro e internacionalización
import { ThemeProvider } from "./theme/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";

// Captura errores no controlados en el árbol de componentes
import ErrorBoundary from "./components/ErrorBoundary";

/* Layout: barra lateral + navegación inferior + enrutamiento interno
   (se usa para todas las rutas protegidas bajo /*) */
import Layout from "./components/Layout";

// Contenedor de notificaciones toast (shadcn/ui)
import { Toaster } from "@/components/ui/toast";

/* Páginas cargadas bajo demanda (lazy) para reducir el bundle inicial */
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

/**
 * LoadingFallback — Componente de "carga" mostrado mientras
 * se descargan las páginas lazy.
 * Renderiza un spinner centrado en pantalla completa.
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0F0A1E" }}>
      {/* Spinner animado con borde violeta */}
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#8B5CF640", borderTopColor: "#8B5CF6" }} />
    </div>
  );
}

/**
 * App — Componente raíz exportado.
 * Provee tema → i18n → ErrorBoundary → Suspense → Routes.
 */
export default function App() {
  return (
    /* ThemeProvider: gestiona tema claro/oscuro y estilos dinámicos */
    <ThemeProvider>
      {/* I18nProvider: internacionalización (textos en español) */}
      <I18nProvider>
        {/* ErrorBoundary: captura errores de React y muestra pantalla de error */}
        <ErrorBoundary>
          <div
            style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}
            className="transition-colors duration-300"
          >
            {/* Suspense: muestra spinner mientras se cargan páginas lazy */}
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Ruta raíz: pantalla de inicio de sesión */}
                <Route path="/" element={<Login />} />
                {/* Ruta de registro */}
                <Route path="/register" element={<Register />} />
                {/* Cualquier otra ruta se maneja con Layout (protegidas) */}
                <Route path="/*" element={<Layout />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
        {/* Toaster: renderiza notificaciones flotantes (shadcn/ui) */}
        <Toaster />
      </I18nProvider>
    </ThemeProvider>
  );
}
