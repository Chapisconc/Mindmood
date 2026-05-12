# TODO.md

## Identificar y corregir warning de React: claves duplicadas

- [ ] Revisar componentes donde se usan `key` basadas en `index`/valores no únicos.
- [ ] Cambiar `key={i}` / `key={index}` por claves derivadas de datos únicos (ej. nombre/label/id).
- [ ] Corregir duplicidad en `StatsScreen` y `EmotionModal` donde `key` usa `item.emotionName` o `index`.
- [ ] Corregir en `AdminDashboardScreen` el uso de `key={i}` en listas de alarmas usando `item.id`/`entry_id` como key.
- [ ] Corregir en `RadarChart` uso de `key={i}` en mapeos (según sea necesario).
- [ ] Ejecutar tests/lint (si aplica) o build para verificar que el warning desaparece.
