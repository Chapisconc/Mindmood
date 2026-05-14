/* ==========================================================================
   toast.jsx — shadcn/ui TOAST (basado en @radix-ui/react-toast)
   Sistema completo de notificaciones toast con:
   - Variantes: default, destructive, success
   - Límite de toasts visibles (TOAST_LIMIT = 5)
   - Auto-dismiss después de TOAST_REMOVE_DELAY (5000ms)
   - Función toast() para mostrar notificaciones programáticamente
   - Hook useToast() para acceder al estado y acciones
   - Componente Toaster que renderiza los toasts activos
   ========================================================================== */

// React: forwardRef, useState, useEffect, createContext, useContext, useCallback
import { forwardRef, useState, useEffect, createContext, useContext, useCallback } from "react";
// Radix UI: primitivas de toast accesibles
import * as ToastPrimitives from "@radix-ui/react-toast";
// CVA: variantes de estilo
import { cva } from "class-variance-authority";
// Ícono de cerrar
import { X } from "lucide-react";
// Utilidad para clases Tailwind
import { cn } from "@/lib/utils";

/* Componente proveedor de toasts (Radix) */
const ToastProvider = ToastPrimitives.Provider;

/**
 * ToastViewport — Contenedor donde aparecen los toasts.
 * En móvil: arriba; en sm+: abajo a la derecha.
 */
const ToastViewport = forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/**
 * toastVariants — Variantes de estilo del toast.
 * default: normal, destructive: error, success: éxito verde.
 */
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Toast — Componente raíz del toast individual.
 * Aplica la variante de estilo y comportamiento de swipe.
 */
const Toast = forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

/**
 * ToastAction — Botón de acción dentro del toast.
 */
const ToastAction = forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-bold ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

/**
 * ToastClose — Botón de cerrar (X) en la esquina superior derecha.
 */
const ToastClose = forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

/**
 * ToastTitle — Título del toast en negrita.
 */
const ToastTitle = forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-bold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

/**
 * ToastDescription — Descripción del toast (texto semi-transparente).
 */
const ToastDescription = forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

/* --- Sistema de estado global para toasts --- */

// Contador para generar IDs únicos
let toastCount = 0;

// Límite máximo de toasts visibles simultáneamente
const TOAST_LIMIT = 5;

// Tiempo en ms antes de descartar un toast automáticamente
const TOAST_REMOVE_DELAY = 5000;

/* Tipos de acciones para el reducer */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

// Estado global en memoria
let memoryState = { toasts: [] };

// Listeners que se notifican cuando cambia el estado
const listeners = [];

/**
 * dispatch — Despacha una acción al reducer y notifica a todos los listeners.
 */
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

/**
 * reducer — Función reductora pura que maneja ADD, UPDATE, DISMISS y REMOVE.
 */
function reducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId ? { ...t, open: false } : t
          ),
        };
      }
      return {
        ...state,
        toasts: state.toasts.map((t) => ({ ...t, open: false })),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

/**
 * genId — Genera un ID único incremental para cada toast.
 */
function genId() {
  toastCount += 1;
  return `toast-${toastCount}`;
}

/**
 * toast — Función imperativa para mostrar un toast desde cualquier lugar.
 * Ejemplo: toast({ title: "Éxito", description: "Guardado", variant: "success" });
 *
 * @returns {Object} { id, dismiss, update }
 */
function toast(props) {
  const id = genId();
  const update = (updatedProps) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...updatedProps, id },
    });
  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Auto-dismiss después del tiempo definido
  setTimeout(() => {
    dismiss();
  }, TOAST_REMOVE_DELAY);

  return { id, dismiss, update };
}

/**
 * useToast — Hook de React para acceder al estado de toasts
 * y a las funciones toast() y dismiss().
 */
function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

/**
 * Toaster — Componente que renderiza todos los toasts activos.
 * Se coloca una vez en el árbol (usualmente en App.jsx).
 */
function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
  toast,
  useToast,
};
