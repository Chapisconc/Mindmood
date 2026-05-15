// ============================================================
// Configuración de Vite para MindMood Web (PWA + React + Tailwind)
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Definir el entorno de build y desarrollo,
//   incluyendo plugins (React, Tailwind CSS, PWA), alias de
//   importación y configuración del Service Worker para
//   funcionamiento offline/capacidad de instalación.
// ============================================================

// --- Vite: función para definir la configuración ---
import { defineConfig } from "vite";
// --- Plugin: soporte JSX/React Fast Refresh ---
import react from "@vitejs/plugin-react";
// --- Plugin: procesamiento de Tailwind CSS v4 ---
import tailwindcss from "@tailwindcss/vite";
// --- Plugin: Progressive Web App (manifest + Service Worker) ---
import { VitePWA } from "vite-plugin-pwa";
// --- Módulo path de Node.js para rutas absolutas ---
import path from "path";

// ================================================================
// Exportación de la configuración por defecto de Vite
// defineConfig provee tipado automático para las opciones de Vite.
// ================================================================
export default defineConfig({
  // === Resolución de módulos ===
  resolve: {
    alias: {
      // Alias "@" → "./src" para imports limpios:
      // import Componente from "@/components/X" en vez de
      // "../../../components/X"
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // === Plugins del build ===
  plugins: [
    react(),      // Soporte JSX/TSX con React Fast Refresh
    tailwindcss(), // Compilación de directivas @tailwind en CSS

    // === Plugin PWA (VitePWA) ===
    // Convierte la app en una Progressive Web App instalable
    // con Service Worker generado automáticamente por Workbox.
    VitePWA({
      // "autoUpdate": el SW se actualiza automáticamente sin
      // requerir confirmación del usuario
      registerType: "autoUpdate",

      // Assets adicionales a precachear (íconos SVG)
      includeAssets: ["icons/*.svg"],

      // === Configuración de Workbox (Service Worker) ===
      workbox: {
        // skipWaiting: activar inmediatamente el nuevo SW
        skipWaiting: true,
        // clientsClaim: el SW activo asume control de todas las
        // pestañas abiertas sin recarga
        clientsClaim: true,
        // Limpiar cachés de versiones anteriores de Workbox
        cleanupOutdatedCaches: true,
        // Patrón global: precachear todos los JS, CSS, PNG, SVG, ICO
        globPatterns: ["**/*.{js,css,ico,png,svg}"],

        // === Estrategias de caché en tiempo de ejecución ===
        runtimeCaching: [
          // --- Caché de HTML (página principal "/") ---
          // Estrategia NetworkFirst: intenta red primero,
          // si falla usa caché. Ideal para contenido dinámico.
          {
            urlPattern: /\/$/,  // Coincide con la raíz "/"
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",              // Nombre del almacén de caché
              networkTimeoutSeconds: 5,             // Timeout de red antes de usar caché
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 } // 1 hora de vida
            }
          },

          // --- Caché de imágenes (estática) ---
          // Estrategia CacheFirst: sirve desde caché primero,
          // solo va a red si no está en caché. Ideal para assets.
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",             // Caché separado para imágenes
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } // 30 días
            }
          },

          // --- Caché de API "/analyze" ---
          // NetworkFirst para endpoints críticos: intenta red,
          // si el servidor no responde usa la última respuesta válida.
          {
            urlPattern: /\/analyze/,                // Coincide con rutas que contengan "/analyze"
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",               // Caché de respuestas de API
              networkTimeoutSeconds: 10,            // Timeout más largo (10s)
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 } // 24 horas
            }
          },
        ]
      },

      // === Manifest de la PWA (instalación en dispositivo) ===
      manifest: {
        name: "MindMood - Diario Inteligente",     // Nombre completo de la app
        short_name: "MindMood",                     // Nombre corto (debajo del ícono)
        description: "Tu espacio seguro de salud mental", // Descripción para la store
        theme_color: "#2E1065",                     // Color del tema (UI chrome)
        background_color: "#0F0A1E",                // Color de fondo en splash screen
        display: "standalone",                      // Modo app independiente (sin URL bar)
        orientation: "portrait",                    // Orientación forzada: retrato
        scope: "/",                                 // Alcance: toda la app
        start_url: "/",                             // Ruta inicial al abrir la app

        // Íconos para distintos tamaños de dispositivo
        icons: [
          {
            src: "/icons/icon-192x192.svg",        // Ícono 192px (Android, splash)
            sizes: "192x192",
            type: "image/svg+xml",                  // Formato vectorial (escalable)
            purpose: "any maskable"                 // Compatible con máscaras adaptativas
          },
          {
            src: "/icons/icon-512x512.svg",        // Ícono 512px (instalación, iOS)
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
        ],
      },
    }),
  ],
});