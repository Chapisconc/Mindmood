/* ==========================================================================
   label.jsx — shadcn/ui LABEL (basado en @radix-ui/react-label)
   Componente de etiqueta accesible para formularios.
   Se asocia automáticamente al input mediante el atributo htmlFor.
   ========================================================================== */

import { forwardRef } from "react";
import { Root } from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * labelVariants — Variante de estilo única para la etiqueta:
 * texto pequeño, negrita, y opacidad reducida si el peer está deshabilitado.
 */
const labelVariants = cva(
  "text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

/**
 * Label — Etiqueta de formulario (shadcn/ui).
 * Usa el componente Root de @radix-ui/react-label para accesibilidad.
 */
const Label = forwardRef(({ className, ...props }, ref) => (
  <Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
