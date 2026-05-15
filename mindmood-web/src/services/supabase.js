// ============================================================
// Servicio de configuración del cliente Supabase
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Inicializar y exportar el cliente de Supabase
//   para autenticación, base de datos y almacenamiento.
// ============================================================

// --- Importar el cliente oficial de Supabase ---
import { createClient } from "@supabase/supabase-js";

// === Variables de entorno ===
// URL del proyecto Supabase (ej: https://xxxxx.supabase.co)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Clave anónima (pública) para RLS; NUNCA exponer service_role key
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// === Validación de credenciales en tiempo de carga ===
// Si faltan variables de entorno, advertir al desarrollador en consola
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
    "Crea mindmood-web/.env a partir de .env.example y reinicia el servidor de desarrollo."
  );
}

// === Adaptador de almacenamiento para tokens de autenticación ===
// Supabase necesita leer/escribir/eliminar la sesión en localStorage.
// Envolvemos cada operación en try/catch para evitar errores
// si localStorage no está disponible (entorno privado/pruebas).
const storageAdapter = {
  // Obtener un valor del almacenamiento local
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item; // Devuelve el string crudo o null si no existe
    } catch {
      return null; // Si hay error (e.g. quota excedida), retornar null
    }
  },
  // Guardar un valor en el almacenamiento local
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {} // Ignorar errores de escritura silenciosamente
  },
  // Eliminar una clave del almacenamiento local
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {} // Ignorar errores de eliminación silenciosamente
  },
};

// === Creación y exportación del cliente Supabase ===
// Se exporta como módulo para que toda la app use la misma instancia.
// Configuraciones:
//   - storage: adaptador personalizado para localStorage
//   - autoRefreshToken: refresca el token automáticamente antes de expirar
//   - persistSession: mantiene la sesión entre recargas del navegador
//   - detectSessionInUrl: detecta tokens en la URL (usado en OAuth/PKCE)
//   - flowType: "pkce" — flujo de autorización PKCE (más seguro que implicit)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
