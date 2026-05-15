/* ==========================================================================
   button.jsx — shadcn/ui BUTTON (variante MindMood)
   Componente de botón reutilizable usando class-variance-authority (CVA)
   para variantes (default, destructive, outline, secondary, ghost, link)
   y tamaños (sm, default, lg, icon). Envuelve el <button> nativo
   o <Slot> de Radix si se usa comoChild.
   ========================================================================== */

// forwardRef para mantener la referencia al elemento DOM
import { forwardRef } from "react";
// Slot de Radix permite que el botón herede estilos a un hijo personalizado
import { Slot } from "@radix-ui/react-slot";
// CVA: genera clases condicionales según variantes y tamaños
import { cva } from "class-variance-authority";
// Utilidad para concatenar clases Tailwind condicionalmente
import { cn } from "@/lib/utils";

/**
 * buttonVariants — Definición de variantes de estilo y tamaño
 * usando la biblioteca class-variance-authority.
 * - Variants: default, destructive, outline, secondary, ghost, link
 * - Sizes: default, sm, lg, icon
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:opacity-80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Button — Componente de botón con variantes (shadcn/ui).
 * Soporta asChild para renderizar un elemento hijo como botón.
 */
const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
