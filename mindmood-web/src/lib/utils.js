// ============================================================
// Utilidades generales para componentes y estilos
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Proveer funciones auxiliares reutilizables,
//   principalmente para la composición de clases CSS con
//   Tailwind CSS y clsx.
// ============================================================

// --- clsx: construcción condicional de strings de clases ---
import { clsx } from "clsx";
// --- twMerge: fusiona clases de Tailwind resolviendo conflictos ---
import { twMerge } from "tailwind-merge";

// ================================================================
// cn (classNames)
// Combina múltiples clases CSS condicionales y resuelve conflictos
// de utilidades de Tailwind (ej: "px-4 px-2" → "px-2").
// Parámetros:
//   ...inputs — Arreglo de clases, objetos condicionales, etc.
//     (acepta el mismo formato que clsx)
// Retorna:  String con clases CSS limpias y resueltas
// Uso típico: className={cn("base", isActive && "active", className)}
// Exportada como función predeterminada del módulo utils.
// ================================================================
export function cn(...inputs) {
  // 1. clsx: convertir inputs condicionales a string de clases
  // 2. twMerge: fusionar clases Tailwind, eliminando duplicados
  return twMerge(clsx(inputs));
}
