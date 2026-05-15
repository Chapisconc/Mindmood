/* ==========================================================================
   Chart.jsx — shadcn/ui CHART (integración con Recharts para MindMood)
   Componentes envoltorio alrededor de Recharts que proveen:
   - ChartContainer: contexto de configuración y ResponsiveContainer
   - ChartTooltipContent: tooltip personalizado con estilo oscuro
   - ChartLegendContent: leyenda personalizada
   - ChartTooltip / ChartLegend: atajos con defaults
   ========================================================================== */

// React: createContext, useContext, useId, forwardRef
import { createContext, useContext, useId, forwardRef } from "react";
// Recharts: contenedor responsivo, tooltip y leyenda base
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from "recharts";

/**
 * ChartContext — Contexto que provee la configuración del gráfico
 * (colores, etiquetas) a los componentes hijos (tooltip, leyenda).
 */
const ChartContext = createContext({ config: {} });

/**
 * ChartContainer — Contenedor del gráfico con contexto y ResponsiveContainer.
 * Asigna un ID único al contenedor usando useId().
 *
 * @prop {Object} config   — Configuración de series { key: { label, color } }
 * @prop {node}   children — Hijos (normalmente un componente de Recharts)
 */
export function ChartContainer({ config, children, className = "", style }) {
  const id = useId();
  return (
    <ChartContext.Provider value={{ config, id }}>
      <div
        data-chart={id}
        className={`w-full ${className}`}
        style={style}
      >
        {/* ResponsiveContainer adapta el ancho/alto al padre */}
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/**
 * ChartTooltipContent — Contenido del tooltip personalizado.
 * Lee la configuración desde ChartContext para mostrar
 * etiquetas y colores definidos en el config.
 *
 * @prop {boolean}  active          — Si el tooltip está activo
 * @prop {Array}    payload         — Datos de la serie en el punto
 * @prop {string}   label           — Etiqueta del eje X
 * @prop {Function} formatter       — Formateador de valores
 * @prop {Function} labelFormatter  — Formateador de la etiqueta
 */
export function ChartTooltipContent({ active, payload, label, formatter, labelFormatter }) {
  const { config } = useContext(ChartContext);
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border p-3 shadow-xl backdrop-blur-xl min-w-[160px]"
      style={{
        backgroundColor: "rgba(15, 10, 30, 0.92)",
        borderColor: "rgba(124, 58, 237, 0.3)",
      }}
    >
      {/* Etiqueta del punto en el eje X */}
      {label && (
        <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#A78BFA" }}>
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {/* Lista de valores en el tooltip */}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry, i) => {
          const key = entry.dataKey || entry.name;
          const cfg = config?.[key] || {};
          return (
            <div key={i} className="flex items-center gap-2">
              {/* Indicador de color de la serie */}
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: cfg.color || entry.color }}
              />
              <span className="text-xs font-semibold" style={{ color: "#E2E8F0" }}>
                {cfg.label || key}:
              </span>
              <span className="text-xs font-black ml-auto" style={{ color: "#FFF" }}>
                {formatter ? formatter(entry.value, key) : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ChartLegendContent — Leyenda personalizada del gráfico.
 * Muestra un círculo de color + nombre de cada serie.
 */
export function ChartLegendContent({ payload }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-3">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-bold opacity-80">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * ChartTooltip — Atajo que envuelve <RechartsTooltip>
 * con ChartTooltipContent como contenido por defecto.
 */
export function ChartTooltip({ content, ...props }) {
  return <RechartsTooltip content={content || <ChartTooltipContent />} {...props} />;
}

/**
 * ChartLegend — Atajo que envuelve <RechartsLegend>
 * con ChartLegendContent como contenido por defecto.
 */
export function ChartLegend({ content, ...props }) {
  return <RechartsLegend content={content || <ChartLegendContent />} {...props} />;
}
