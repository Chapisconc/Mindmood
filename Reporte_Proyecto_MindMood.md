# Reporte del Proyecto de Software — MindMood

## 1) Portada

- **Nombre del proyecto:** MindMood (Diario Inteligente)
- **Materia / curso:** (completar)
- **Institución:** (completar)
- **Integrantes del equipo:** (completar nombres y roles)
- **Docente:** (completar)
- **Fecha:** (completar)

> Nota: La portada debe incluir el logo (si aplica) y seguir el formato solicitado por tu rúbrica/plantilla.

---

## 2) Índice

1. Descripción del proyecto de software
2. Justificación
3. Viabilidad
4. Objetivos
5. Riesgos
6. Tabla de requerimientos
7. Diagrama de Gantt y planeación de actividades (timing plan)
8. Diagrama de casos de uso
9. Diagrama de secuencia
10. Diagrama de clases (arquitectura)
11. Diagrama de máquinas de estado (una funcionalidad)
12. Casos de prueba modulares (5)
13. Casos de prueba de integración (5)
14. Casos de prueba de sistema (5)
15. Reporte de pruebas (passed/failed)
16. Conclusiones (con conclusiones por cada integrante)

---

## 3) Descripción del proyecto de Software

**MindMood** es una aplicación tipo **diario emocional inteligente** que permite a los usuarios registrar entradas textuales y obtener un análisis automático de su estado emocional. El sistema:

- Detecta emociones en el texto (modelo de lenguaje/emoción + reglas y refuerzos).
- Calcula una métrica de **confianza** y un estado general.
- Permite al usuario escoger emociones para mejorar la conciliación final (mezcla modelo + usuario).
- Registra el historial y estadísticas personales.
- Incluye un **panel de administración** para gestionar casos críticos (crisis) y contactar usuarios.

### Arquitectura general (alto nivel)

- **Frontend (web):** interfaz en React (mindmood-web).
- **Backend de análisis (API):** servicio FastAPI que recibe texto y devuelve resultados emocionales.
- **Base de datos (Supabase/PostgreSQL):** almacenamiento de usuarios, perfiles, entradas, requests de contacto, y funciones RPC.

### Funcionalidades principales

1. **Registro y Login** (usuarios y admins)
   - Alta de usuario.
   - Autenticación.
   - Asignación de rol (admin/user).

2. **Nueva entrada / análisis emocional**
   - El usuario escribe una entrada.
   - Se envía al backend.
   - Backend devuelve:
     - emoción principal
     - distribución emocional (cuando aplica)
     - emociones detectadas
     - score/confianza
     - resumen y tipo (normal/crisis)

3. **Conciliación emoción modelo vs usuario**
   - El usuario puede seleccionar emociones.
   - Se realiza una fusión matemática (mezcla ponderada) para decidir la emoción final y distribución.

4. **Detección de crisis**
   - Si hay indicadores de crisis, se marca el caso.
   - En crisis el usuario recibe medidas de soporte.

5. **Panel de usuario: historial y estadísticas**
   - Historial de entradas.
   - Estadísticas con gráficas (pie/bar/radar según corresponda).

6. **Panel admin (Admin Dashboard)**
   - Vista de incidentes críticos.
   - Estados: **Activas / En Proceso / Resueltas**.
   - Acción: **Contactar** (crea request de contacto).
   - Visualización de métricas globales:
     - distribución global de emociones
     - frecuencia por emoción
     - salud global / emoción dominante

---

## 4) Justificación

- **Necesidad del problema:** muchas personas registran sentimientos, pero es difícil interpretar patrones emocionales sin apoyo.
- **Propuesta:** automatizar análisis emocional y permitir que el usuario participe en la validación.
- **Valor agregado:**
  - explica el estado (no solo etiqueta)
  - ofrece manejo de crisis (triage → “contactar/soporte”)
  - permite métricas para observar evolución.

---

## 5) Viabilidad

### Técnica

- Uso de **modelos preentrenados** (emotion/sentiment) y reglas heurísticas.
- Integración con **Supabase** para persistencia y seguridad.
- Frontend moderno (React) y visualización con librerías gráficas.

### Económica

- Evita entrenamiento desde cero.
- Reutiliza componentes existentes (modelos y servicios).

### Operativa

- Existen endpoints claros y un flujo reproducible de análisis.
- Se puede desplegar en Vercel (frontend) y un servicio separado para backend.

---

## 6) Objetivos

### Objetivo general

Construir un sistema que permita registrar emociones y obtener análisis inteligente y útil, incluyendo gestión de casos críticos desde un panel admin.

### Objetivos específicos

1. Implementar análisis emocional del texto en el backend.
2. Implementar conciliación modelo+usuario con fusión por incertidumbre (α dinámico por entropía) y voto suavizado.
3. Persistir entradas y métricas.
4. Implementar dashboard admin con:
   - gestión de estados (activa/en proceso/resuelta)
   - acción “Contactar”
   - visualización global de emociones.
5. Implementar estadísticas del usuario y UI robusta.

---

## 7) Riesgos

1. **Calidad del modelo emocional**
   - Riesgo: emociones erróneas en textos con ironía o ambigüedad.
   - Mitigación: conciliación con selección del usuario y reglas.

2. **Riesgo de datos vacíos**
   - Riesgo: estadísticas/gráficas no muestran resultados si el dataset está incompleto.
   - Mitigación: fallbacks en frontend (sin romper UI).

3. **Riesgos de seguridad (RLS)**
   - Riesgo: admins no pueden leer datos o usuarios ven datos de otros.
   - Mitigación: policies y funciones SECURITY DEFINER.

4. **Riesgos de performance**
   - Riesgo: latencia en análisis.
   - Mitigación: caching, límites de longitud de entrada, rate-limits.

5. **Riesgos de cumplimiento en crisis**
   - Riesgo: mensajes inadecuados.
   - Mitigación: texto de soporte estándar y enfoque a contacto/servicios.

---

## 8) Tabla de requerimientos

> Completa los campos que falten con el formato exacto que use tu plantilla.

|    Id |   Tipo    | Funcionalidad | Requerimiento                                          | Prioridad | Comentarios             | Id_Test_Case_Satisfied |
| ----: | :-------: | ------------- | ------------------------------------------------------ | :-------: | ----------------------- | ---------------------- |
| FR-01 | Funcional | Auth          | El sistema debe permitir login/registro                |   Alta    | Usar Supabase auth      | TC-INT-01              |
| FR-02 | Funcional | Análisis      | Debe procesar una entrada y devolver emoción principal |   Alta    | API FastAPI             | TC-MOD-02              |
| FR-03 | Funcional | Emociones     | Debe devolver lista de emociones detectadas            |   Media   | Filtrado de ruido       | TC-MOD-03              |
| FR-04 | Funcional | Conciliación  | Debe fusionar emoción modelo vs usuario con α dinámico |   Alta    | Sin entrenamiento       | TC-MOD-04              |
| FR-05 | Funcional | Crisis        | Si detecta crisis, marca tipo crisis y activa soporte  |   Alta    | Evitar falsos negativos | TC-SYS-02              |
| FR-06 | Funcional | Persistencia  | Debe guardar entradas en BD                            |   Alta    | RLS y policies          | TC-INT-03              |
| FR-07 | Funcional | Historial     | Usuario puede ver entradas pasadas                     |   Media   | UI lista/consulta       | TC-SYS-03              |
| FR-08 | Funcional | Estadísticas  | Mostrar gráficas con distribución de emociones         |   Media   | Pie/Bar/Radar           | TC-SYS-04              |
| FR-09 | Funcional | Admin         | Admin puede ver incidentes críticos                    |   Alta    | RPC/consultas           | TC-INT-04              |
| FR-10 | Funcional | Contactar     | Admin puede crear solicitud de contacto                |   Alta    | Actualiza estados       | TC-INT-05              |

---

## 9) Diagrama de Gantt y planeación (timing plan)

> Aquí debes adjuntar un diagrama (o tabla tipo Gantt) con semanas/días.

### Qué debe incluir el diagrama (descripción detallada)

- **Ejes:**
  - Eje horizontal: semanas/fechas (ej. Semana 1 a Semana 6)
  - Eje vertical: tareas principales
- **Tareas sugeridas (mínimo):**
  1. Levantamiento de requerimientos y diseño (Semana 1)
  2. Setup repositorio, CI básico, entorno local (Semana 1-2)
  3. Desarrollo backend análisis emocional (Semana 2-3)
  4. Desarrollo frontend flujo de nueva entrada (Semana 2-3)
  5. Conciliación y pruebas unitarias (Semana 3-4)
  6. Implementación estadísticas e historial (Semana 4)
  7. Admin dashboard: incidentes + contacto + gráficas globales (Semana 4-5)
  8. Integración completa + pruebas (Semana 5-6)
  9. Documentación final + despliegue + presentación (Semana 6)

### Entregables

- Repositorio con tags.
- Deploy staging.
- Reporte de pruebas.

---

## 10) Diagrama de Casos de uso

> Adjunta un diagrama UML de casos de uso.

### Descripción detallada de qué debe llevar

\*\*Actores:]

- Usuario (normal)
- Admin (rol)

**Casos de uso (ejemplos):**

- Usuario:
  - Registrar y autenticar
  - Crear una nueva entrada
  - Seleccionar emociones (si aplica)
  - Ver análisis y distribución
  - Ver historial
  - Ver estadísticas
- Admin:
  - Ver métricas globales
  - Ver incidentes críticos
  - Filtrar por estado
  - Contactar usuario
  - Cambiar estado de incidentes (activa → en proceso → resuelta)

\*\*Relaciones:]

- Inclusión/Extensión para:
  - análisis emocional incluye llamada al backend
  - crisis incluye verificación de indicadores y mostrar soporte

---

## 11) Diagrama de Secuencia

> Adjunta un diagrama de secuencia UML.

### Recomendación: un flujo clave (New Entry + Analysis)

**Participantes:**

- UI (Frontend)
- API backend (FastAPI)
- Supabase (persistencia)
- Modelos de ML (pipeline)

**Mensajes (descripción de lo que debe aparecer):**

1. Frontend envía texto a `POST /analyze`
2. Backend limpia/normaliza texto
3. Backend invoca modelo de sentimiento y emoción
4. Backend calcula score/confianza y detecta crisis
5. Backend aplica conciliación con selección del usuario (si aplica)
6. Backend devuelve `AnalysisResponse`
7. Frontend muestra modal con evaluación
8. Frontend guarda entrada en Supabase (o backend lo hace)

---

## 12) Diagrama de Clases (Arquitectura)

> Adjunta un diagrama UML de clases.

### Descripción de clases que deben aparecer

- **Client UI**
  - Componentes: NewEntry, EmotionModal, Stats, AdminDashboard
- **Backend API**
  - Endpoint: analyze
  - Funciones: normalización, detección crisis, fusión emociones
  - Modelos: AnalyzeRequest, AnalysisResponse
- **Dominio (Supabase)**
  - Entidades: profiles, entries, contact_requests
  - Funciones/RPC: get_admin_stats, get_admin_alarms, etc.

### Atributos/relaciones (qué describir)

- Relación entre `entries` y `profiles` (FK user_id)
- Relación entre `contact_requests` y `entries` (entry_id opcional)

---

## 13) Diagrama de Máquinas de estado

> Se pide “una funcionalidad”. Recomendación: estado de un incidente crítico.

### Máquina de estados sugerida

- \*\*Estados:]
  - active (Crítica)
  - working (En Proceso)
  - resolved (Resuelta)

### Transiciones

- active → working (admin actualiza estado)
- working → resolved (admin resuelve)
- resolved → active (reabrir si aplica)

### Qué debe incluir el diagrama

- Nodo por estado con etiquetas.
- Flechas con evento:
  - “Pasar a Proceso”
  - “Marcar Resuelta”
  - “Reabrir”

---

## 14) Casos de prueba modulares (5)

> 5 casos unitarios sobre funciones específicas.

|        Id | Módulo                 | Caso de prueba                              | Entrada                  | Salida esperada                                   |
| --------: | ---------------------- | ------------------------------------------- | ------------------------ | ------------------------------------------------- |
| TC-MOD-01 | Fusión de emociones    | α dinámico por entropía                     | distribución uniforme    | α alto (cerca de alpha_max)                       |
| TC-MOD-02 | Fusión de emociones    | α bajo cuando modelo es seguro              | distribución concentrada | α bajo (cerca alpha_min)                          |
| TC-MOD-03 | Voto suavizado usuario | q_user genera distribución no determinista  | r=0.7                    | emoción seleccionada con peso r y resto repartido |
| TC-MOD-04 | Conciliación           | Si usuario elige 2da opción reñida, boost α | empate top1/top2         | α incrementa y distribución cambia                |
| TC-MOD-05 | Crisis detection       | Indicadores activan crisis                  | texto con palabras clave | requires_help=true, crisis_level=critical         |

---

## 15) Casos de prueba de integración (5)

> Probar interacción entre módulos: UI↔API↔Supabase.

|        Id | Integración       | Caso de prueba                                | Entrada          | Resultado                           |
| --------: | ----------------- | --------------------------------------------- | ---------------- | ----------------------------------- |
| TC-INT-01 | Auth              | Login con usuario válido                      | credenciales     | sesión estable                      |
| TC-INT-02 | analyze endpoint  | POST /analyze y validación de respuesta       | texto            | mood, emociones, score, confianza   |
| TC-INT-03 | Guardado          | Guardar entrada y recuperar historial         | entrada nueva    | aparece en historial                |
| TC-INT-04 | Admin RPC/listado | admin obtiene incidentes por estado           | rol admin        | lista no vacía cuando existe /      |
| TC-INT-05 | Contactar         | Contact request creada al presionar Contactar | incidente activo | contact_requests con estado pending |

---

## 16) Casos de prueba de sistema (5)

> Pruebas E2E en condiciones reales.

|        Id | Sistema      | Caso de prueba                     | Pasos            | Resultado                         |
| --------: | ------------ | ---------------------------------- | ---------------- | --------------------------------- |
| TC-SYS-01 | Flujo básico | Registro→nueva entrada→modal       | 1 usuario        | se completa sin errores           |
| TC-SYS-02 | Crisis       | Crear texto crítico                | 1 usuario        | aparece soporte y tipo crisis     |
| TC-SYS-03 | Admin        | admin ve incidentes                | rol admin        | se muestran incidentes y acciones |
| TC-SYS-04 | Estadísticas | cargar datos y renderizar gráficas | varios registros | gráficas visibles                 |
| TC-SYS-05 | Dark/Light   | alternar tema                      | admin y usuario  | UI cambia sin romper legibilidad  |

---

## 17) Reporte de pruebas (passed/failed)

> Completar tras ejecutar los tests.

- **Total pruebas:** 15 (Modulares: 5, Integración: 5, Sistema: 5)
- **Passed:** (completar)
- **Failed:** (completar)

**Resumen:**

- Fallidas: (listar IDs y causa)
- Pasadas: (listar o indicar “todas las demás”)

---

## 18) Conclusiones (por integrante)

> Deben contener conclusiones separadas por cada integrante.

### Integrante 1 — (Nombre)

- Conclusión sobre la parte que trabajó.
- Qué aprendió.
- Dificultades y cómo las resolvió.

### Integrante 2 — (Nombre)

- Conclusión sobre la parte que trabajó.
- Qué aprendió.
- Impacto en el proyecto.

### Integrante 3 — (Nombre)

- Conclusión sobre la parte que trabajó.
- Qué aprendió.
- Lecciones para futuras versiones.

---

## Checklist final (para rúbrica)

- [ ] Incluye TODOS los elementos requeridos.
- [ ] Diagrama (descripción) es congruente con el proyecto.
- [ ] Diagrama de máquinas de estado incluye al menos una funcionalidad.
- [ ] Tabla de requerimientos con columna de test case satisface.
- [ ] Reporte de pruebas con total passed/failed.
- [ ] Conclusiones por integrante.
- [ ] Presentación (10 min max) con guion.
