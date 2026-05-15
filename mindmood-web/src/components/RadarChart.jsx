/* ==========================================================================
   RadarChart.jsx — GRÁFICO DE RADAR SVG (MindMood)
   Componente de visualización SVG puro (sin librerías externas)
   que dibuja un gráfico de radar/telaraña para mostrar múltiples
   dimensiones emocionales (ej. ansiedad, ánimo, energía, etc.).
   ========================================================================== */

/**
 * RadarChart — Gráfico de radar generado con SVG nativo.
 * Dibuja círculos concéntricos, ejes radiales, etiquetas,
 * un polígono de datos y puntos en cada vértice.
 *
 * @prop {Array}  data      — Arreglo de objetos { label, value }
 * @prop {number} maxValue  — Valor máximo de la escala (default: 10)
 * @prop {number} size      — Tamaño en píxeles del SVG (default: 280)
 */
export default function RadarChart({ data = [], maxValue = 10, size }) {
  const chartSize = size || 280;
  const center = chartSize / 2;
  const radius = center * 0.75;
  const total = data.length;

  if (total === 0) return null;

  /* Calcula las coordenadas (x,y) del polígono de datos escalado */
  const points = data
    .map((item, i) => {
      const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
      const value = Math.max(0, item.value);
      const x = center + ((radius * value) / maxValue) * Math.cos(angle);
      const y = center + ((radius * value) / maxValue) * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  /* Calcula coordenadas de los ejes y posiciones de las etiquetas */
  const axisPoints = data.map((item, i) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const labelX = center + (radius + 24) * Math.cos(angle);
    const labelY = center + (radius + 24) * Math.sin(angle);
    return { x, y, labelX, labelY, label: item.label };
  });

  return (
    <div className="flex items-center justify-center" style={{ width: chartSize, height: chartSize }}>
      <svg width={chartSize} height={chartSize}>
        {/* Círculos concéntricos de referencia (20%, 40%, 60%, 80%, 100%) en violeta claro punteado */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((step, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * step}
            stroke="#E9D5FF"
            strokeWidth="1"
            fill="none"
            strokeDasharray="6,6"
          />
        ))}

        {/* Ejes radiales desde el centro hacia cada etiqueta */}
        {axisPoints.map((p, idx) => (
          <g key={`${p.label}-${idx}`}>
            <line x1={center} y1={center} x2={p.x} y2={p.y} stroke="#E9D5FF" strokeWidth="1.5" />
            {/* Etiqueta de cada dimensión */}
            <text x={p.labelX} y={p.labelY} fill="#7C3AED" fontSize="9" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
              {p.label}
            </text>
          </g>
        ))}

        {/* Polígono relleno con los datos (semi-transparente rosa) */}
        <polygon points={points} fill="rgba(236, 72, 153, 0.2)" stroke="#EC4899" strokeWidth="3" />

        {/* Puntos en cada vértice del polígono de datos */}
        {points.split(" ").map((p, idx) => {
          const [x, y] = p.split(",");
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="5"
              fill="#EC4899"
              stroke="#FFF"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
}
