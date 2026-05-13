import { createContext, useContext, useId, forwardRef } from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from "recharts";

const ChartContext = createContext({ config: {} });

export function ChartContainer({ config, children, className = "", style }) {
  const id = useId();
  return (
    <ChartContext.Provider value={{ config, id }}>
      <div
        data-chart={id}
        className={`w-full ${className}`}
        style={style}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

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
      {label && (
        <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#A78BFA" }}>
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry, i) => {
          const key = entry.dataKey || entry.name;
          const cfg = config?.[key] || {};
          return (
            <div key={i} className="flex items-center gap-2">
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

export function ChartTooltip({ content, ...props }) {
  return <RechartsTooltip content={content || <ChartTooltipContent />} {...props} />;
}

export function ChartLegend({ content, ...props }) {
  return <RechartsLegend content={content || <ChartLegendContent />} {...props} />;
}
