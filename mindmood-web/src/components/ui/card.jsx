/* ==========================================================================
   card.jsx — shadcn/ui CARD (variante MindMood)
   Componentes de tarjeta compuestos: Card, CardHeader, CardTitle,
   CardDescription, CardContent y CardFooter.
   Siguen el patrón de diseño compuesto de shadcn/ui con bordes
   redondeados (2xl) y sombra sutil.
   ========================================================================== */

// forwardRef para mantener la referencia al elemento DOM
import { forwardRef } from "react";
// Utilidad para concatenar clases Tailwind condicionalmente
import { cn } from "@/lib/utils";

/**
 * Card — Contenedor principal de la tarjeta con borde redondeado y sombra.
 */
const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * CardHeader — Encabezado de la tarjeta (padding superior).
 */
const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle — Título de la tarjeta en negrita extra.
 */
const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-black leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription — Descripción secundaria de la tarjeta (texto atenuado).
 */
const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent — Cuerpo de la tarjeta (sin padding superior).
 */
const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter — Pie de la tarjeta, flex row con padding.
 */
const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
