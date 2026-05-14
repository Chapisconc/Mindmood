/* ==========================================================================
   ErrorBoundary.jsx — BARRERA DE ERRORES (Error Boundary) de MindMood
   Componente de clase React que captura errores no controlados
   en el árbol de componentes hijos y muestra una pantalla de error
   con opción de reintentar (hasta 3 veces).
   ========================================================================== */

// React.Component es necesario para implementar componentDidCatch
import { Component } from "react";

// Iconos de lucide-react para la interfaz de error
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary — Clase que envuelve la aplicación.
 * Captura errores de renderizado con getDerivedStateFromError
 * y componentDidCatch, mostrando una UI alternativa.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    /* Estado del error: si ocurrió (hasError), el objeto error,
       y un contador de reintentos (máximo 3) */
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  /**
   * getDerivedStateFromError — Método estático del ciclo de vida.
   * Se ejecuta cuando un hijo lanza un error; actualiza el estado
   * para que render() muestre la UI de error.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * componentDidCatch — Registra el error en consola (solo en desarrollo).
   */
  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV)
      console.error("Error caught by boundary:", error, errorInfo);
  }

  /**
   * handleRetry — Reinicia el estado para intentar renderizar
   * los hijos de nuevo. Incrementa el contador de reintentos.
   */
  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  /**
   * render — Si hay error, muestra la pantalla de error;
   * de lo contrario renderiza los hijos (this.props.children).
   */
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backgroundColor: "#FAF5FF",
          }}
        >
          {/* Icono de advertencia */}
          <AlertTriangle size={48} color="#EC4899" />
          <h1
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#2D1B69",
              marginBottom: 16,
              marginTop: 16,
            }}
          >
            Oops! Something went wrong.
          </h1>
          {/* Mensaje de error específico si está disponible */}
          <p
            style={{
              fontSize: 16,
              color: "#7C3AED",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          {/* Botón de reintentar (se oculta tras 3 intentos) */}
          {this.state.retryCount < 3 && (
            <button
              onClick={this.handleRetry}
              style={{
                backgroundColor: "#EC4899",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: 28,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={24} />
              Try Again
            </button>
          )}
          {/* Mensaje cuando se agotan los reintentos */}
          {this.state.retryCount >= 3 && (
            <p style={{ color: "#7C3AED", fontWeight: 800 }}>
              Max retries reached. Please refresh the page.
            </p>
          )}
        </div>
      );
    }

    /* Sin error: renderiza los componentes hijos normalmente */
    return this.props.children;
  }
}

export default ErrorBoundary;
