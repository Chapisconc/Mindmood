import React from "react";
import { View, Dimensions } from "react-native";
import Svg, {
  Polygon,
  Line,
  Circle,
  Text as SvgText,
  G,
} from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function RadarChart({ data, maxValue = 10, size = width - 80 }) {
  const { themeStyles } = useTheme();
  const center = size / 2;
  const radius = center * 0.8;
  const total = data.length;

  const points = data
    .map((item, i) => {
      const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
      const value = Math.max(0.5, item.value); // Mínimo visual para que no desaparezca
      const x = center + ((radius * value) / maxValue) * Math.cos(angle);
      const y = center + ((radius * value) / maxValue) * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const axisPoints = data.map((item, i) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const labelX = center + (radius + 20) * Math.cos(angle);
    const labelY = center + (radius + 20) * Math.sin(angle);
    return { x, y, labelX, labelY, label: item.label, icon: item.icon };
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G>
          {/* Círculos de fondo (Grid) */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((step, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius * step}
              stroke={themeStyles.border}
              strokeWidth="1"
              fill="none"
              strokeDasharray="4,4"
            />
          ))}

          {/* Ejes */}
          {axisPoints.map((p) => (
            <React.Fragment key={`${p.label}-${p.x}-${p.y}`}>
              <Line
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke={themeStyles.border}
                strokeWidth="1"
              />
              <SvgText
                x={p.labelX}
                y={p.labelY}
                fill={themeStyles.secondaryText}
                fontSize="10"
                fontWeight="800"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {p.label}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Polígono de Datos */}
          <Polygon
            points={points}
            fill={themeStyles.accent + "40"}
            stroke={themeStyles.accent}
            strokeWidth="3"
          />

          {/* Puntos de datos */}
          {points.split(" ").map((p) => {
            const [x, y] = p.split(",");
            return (
              <Circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="4"
                fill={themeStyles.accent}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
