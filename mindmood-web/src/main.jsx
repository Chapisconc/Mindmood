/* ==========================================================================
   main.jsx — PUNTO DE ENTRADA de la aplicación MindMood
   Renderiza el componente raíz <App /> dentro de StrictMode
   y envuelve todo en BrowserRouter para el enrutamiento SPA.
   ========================================================================== */

// Dependencias: React, ReactDOM y el router del navegador
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Componente raíz de la aplicación
import App from "./App";

/* Estilos globales de la aplicación (Tailwind + personalizados) */
import "./index.css";

/* Monta la aplicación en el elemento <div id="root"> del HTML */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BrowserRouter habilita el enrutamiento del lado del cliente */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
