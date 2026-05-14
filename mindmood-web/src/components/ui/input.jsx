/* ==========================================================================
   input.jsx — shadcn/ui INPUT
   Componente de entrada de texto estilizado con bordes redondeados (xl),
   ancho completo, foco con anillo de color primario y soporte
   para archivos (file input).
   ========================================================================== */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Input — Campo de texto genérico (shadcn/ui).
 * Soporta todos los tipos de input HTML (text, email, password, file, etc.).
 *
 * @prop {string} className — Clases adicionales Tailwind
 * @prop {string} type      — Tipo de input (default: "text")
 */
const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
