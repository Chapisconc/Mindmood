# Documentos de Arquitectura SW — MindMood

> Objetivo: Proveer un **paquete listo para generar imágenes/diagramas** (como prompt) y una **especificación** ultra detallada para que otra IA o un diseñador/ingeniero pueda elaborar la arquitectura.

---

## 0) Alcance y supuestos

- Arquitectura del sistema MindMood: **Frontend web (React/Vite)** + **Backend de análisis (FastAPI)** + **Supabase (PostgreSQL + Auth + RLS)**.
- Se asume que el backend de análisis expone un endpoint principal **POST /analyze** y opcionalmente otros endpoints.
- El admin dashboard consume estadísticas globales y lista de incidentes críticos.
- Los componentes de la aplicación incluyen:
  - Gestión de usuarios (auth)
  - Creación de entradas con análisis emocional
  - Conciliación modelo vs. usuario (fusión por incertidumbre)
  - Persistencia de entradas y requests
  - Panel de admin con visualizaciones globales

---

## 1) SW Architecture Document (AD)

### 1.1 Nombre del documento

**SW Architecture Document — MindMood (Diario Inteligente)**

### 1.2 Resumen ejecutivo

MindMood es un sistema que permite a usuarios registrar texto emocional y recibir un análisis de emociones (mood principal, distribución emocional, score/confianza). La plataforma combina:

1. **Modelos de ML** (sentimiento y clasificación de emociones)
2. **Heurísticas y refuerzos** basados en reglas (palabras clave, intensificadores, detección de crisis)
3. **Conciliación probabilística** (mezcla ponderada con α dinámico por entropía y voto suavizado del usuario)
4. **Persistencia y gobernanza** (Supabase con RLS y políticas)
5. **Paneles de UI** (usuario: historial y estadísticas; admin: incidentes críticos y contacto)

---

### 1.3 Diagrama de contexto (Context Diagram)

#### Propósito

- Mostrar cómo interactúan **usuarios**, **frontend**, **backend de análisis** y **Supabase**.

#### Elementos a incluir

- Actor: Usuario
- Actor: Admin
- Frontend web (Mindmood-Web)
- Backend API (FastAPI: /analyze)
- Supabase (Auth + DB + RPC + RLS)
- (Opcional) Servicios de ML/pipelines (solo como caja “Model inference”)

#### Prompt para generar la imagen (ultra detallado)

> **Formato recomendado**: 16:9, fondo claro, estilo UML/C4.

**Prompt:**

“Genera un diagrama de contexto C4 Level 1 para el sistema ‘MindMood’. Debe incluir cuatro grandes contenedores alineados horizontalmente con flechas de comunicación:

1. ‘Usuarios’ (actor humano) y ‘Admin’ (actor humano) en la parte izquierda.
2. ‘Mindmood Web App (React/Vite)’ en el centro.
3. ‘Mindmood Backend API (FastAPI)’ a la derecha.
4. ‘Supabase (Auth + PostgreSQL + RLS + RPC)’ debajo o más a la derecha.
   Agrega flechas con etiquetas:

- ‘login/register’ desde Usuarios -> Mindmood Web App -> Supabase Auth
- ‘crear entrada’ desde Usuarios -> Mindmood Web App
- ‘POST /analyze (texto)’ desde Mindmood Web App -> FastAPI
- ‘persistir/consultar entradas, perfiles, contacto’ desde Mindmood Web App -> Supabase
- ‘consultar incidentes críticos y estadísticas’ desde Admin -> Mindmood Web App -> Supabase (RPC)
  Incluye una caja opcional pequeña ‘ML Inference’ dentro del Backend API para indicar modelos sentiment/emotion.
  Estilo: cajas rectangulares con bordes azul/gris, tipografía legible, íconos sutiles, sin exceso de texto. Debe verse claramente quién llama a quién.
  Tamaño: 1920x1080.”

---

### 1.4 Diagrama de contenedores (Container Diagram)

#### Propósito

- Mostrar componentes ejecutables: Frontend, Backend, Supabase, storage, etc.

#### Contenedores sugeridos

- UI: React App (Mindmood Web)
- API: FastAPI Analysis Service
- DB: Supabase Postgres
- Auth Provider: Supabase Auth
- ML Pipelines: model pipeline inside backend

#### Prompt para generar la imagen

“Crea un diagrama C4 Level 2 (Contenedores) del sistema MindMood. Debe mostrar:

- Un contenedor ‘Browser / Web UI’ (ícono navegador) que muestra ‘React/Vite App’.
- Un contenedor ‘Backend Analysis Service’ (ícono servidor) con ‘FastAPI’ y endpoints ‘POST /analyze’, y dentro un compartimento ‘Sentiment Pipeline’ y ‘Emotion Pipeline’.
- Un contenedor ‘Supabase Project’ con tres subelementos: ‘Auth’, ‘PostgreSQL DB’, ‘RPC Functions’.
- Flechas:
  Browser -> FastAPI: POST /analyze
  Browser -> Supabase: CRUD entries/profiles/contact_requests
  Browser -> Supabase Auth: login/session
  FastAPI -> Supabase (opcional) si el backend guarda logs o no; si no, no agregar flecha o pon ‘solo cálculo’.
  Usa colores: UI azul, API verde, DB gris.
  Incluye labels claras para endpoints y flujos de datos. Formato 16:9, 1920x1080.”

---

### 1.5 Diagrama de componentes (Component Diagram)

#### Propósito

- Descomponer backend en módulos de lógica.

#### Componentes backend sugeridos

- Text Normalization (slang normalization, accent stripping)
- Sentiment Analysis (HF sentiment pipeline + VADER)
- Emotional Detection (emotion pipeline)
- Keyword Reinforcement (EMOTION_KEYWORDS + regex)
- Crisis Detection (indicators + crisis_level)
- Fusion Engine (α dynamic by entropy + soft voting + conciliación)
- Response Builder (AnalysisResponse)

#### Prompt para generar la imagen

“Genera un diagrama de componentes UML para el Backend Analysis Service (FastAPI) de MindMood. Incluye cajas (components) conectadas por flechas de flujo. Cajas:

1. ‘Request Handler (POST /analyze)’
2. ‘Text Normalization (emoji removal, lowercasing, accents, slang)’
3. ‘Sentiment Analysis (HF sentiment + VADER + intensifiers)’
4. ‘Emotion Probability (HF emotion pipeline -> mapped emotions)’
5. ‘Keyword Reinforcement (regex word boundaries)’
6. ‘Crisis Detection (crisis indicators + crisis_level)’
7. ‘Fusion Engine (entropy-based α + soft voting + conflict reconciliation)’
8. ‘Analysis Response Builder (AnalysisResponse)’
   Representa el flujo con flechas secuenciales y flecha de retorno al ‘Client UI’. Añade una nota pequeña: ‘Sin entrenamiento adicional: solo heurísticas y fusión'. Estilo: blanco, tipografía legible, flechas gruesas, 1920x1080.”

---

### 1.6 Decisiones arquitectónicas clave (ADRs resumidas)

1. **Fusión sin entrenamiento adicional**: usar entropía del modelo para ajustar α dinámicamente.
2. **Voto suavizado del usuario**: modelar fiabilidad r para evitar decisiones rígidas.
3. **Crisis detection por heurísticas**: palabras clave/estructura para marcar crisis.
4. **RLS en Supabase**: proteger datos de usuarios y permitir admin por medio de funciones SECURITY DEFINER.
5. **Separación UI vs API**: frontend en Vercel, backend en servicio aparte.

---

### 1.7 Calidad de software (NFRs)

- **Performance**: rate limit por IP en el backend.
- **Scalability**: pipeline de ML con modelos ya cargados; evitar recarga.
- **Security**: RLS + policies + SECURITY DEFINER.
- **Observability**: logs en backend para crisis detections y errores de pipelines.
- **Usability**: UI con modales y estados claros (activo/en proceso/resuelto).

---

### 1.8 Diagrama de despliegue (Deployment Diagram)

#### Prompt

“Genera un diagrama UML de despliegue para MindMood. Incluye:

- ‘Vercel/Frontend Hosting’ con nodo ‘Mindmood Web App’.
- ‘Compute/Server’ con nodo ‘FastAPI Backend Service’.
- ‘Supabase Cloud’ con nodo ‘Auth + Postgres DB + RPC’.
  Incluye flechas de comunicación: frontend -> backend (/analyze) y frontend -> Supabase (CRUD, RPC). Formato 16:9.”

---

## 2) SW Architecture Checklist

> Lista de verificación (para que el reporte sea “audit-proof”).

### 2.1 Estructura del reporte

- [ ] Existe un **Context Diagram (C4 L1)**
- [ ] Existe un **Container Diagram (C4 L2)**
- [ ] Existe un **Component Diagram** del backend
- [ ] Existe un **Deployment Diagram**

### 2.2 Integración y flujos

- [ ] Se documenta flujo UI -> Backend (/analyze)
- [ ] Se documenta flujo UI -> Supabase (entries/profiles/contact_requests)
- [ ] Se documenta cómo el admin consulta incidentes
- [ ] Se documenta cómo se actualizan estados (active -> working -> resolved)

### 2.3 Seguridad

- [ ] Se explica RLS en Supabase
- [ ] Se documenta SECURITY DEFINER en funciones para admin
- [ ] Se documenta qué datos ve el usuario vs el admin

### 2.4 Calidad

- [ ] Se mencionan NFRs: performance, observabilidad, escalabilidad
- [ ] Se menciona rate limiting

### 2.5 Consistencia de datos

- [ ] Se documenta esquema de datos mínimo (profiles, entries, contact_requests)
- [ ] Se documenta el contrato del endpoint /analyze (request/response)

---

## 3) SW SDD Document (Software Design Description)

> Documento de diseño detallado enfocado en: contratos, algoritmos de fusión, y pantallas clave.

### 3.1 Contratos del API

#### AnalyzeRequest

- input: `text: string`
- input: `selected_moods: string[] (opcional)`

#### AnalysisResponse

- `mood: string` (emoción final)
- `all_moods: string[]` (lista de emociones detectadas)
- `emotions_distribution: dict<string, number>` (si aplica)
- `score: float` (sentimiento / compound)
- `confidence: float` (0..1)
- `summary: string`
- `requires_help: bool`
- `crisis_level: string`
- `selected_moods: string[]`

#### Prompt para diagrama de secuencia del API

“Genera un diagrama de secuencia UML para el endpoint POST /analyze en MindMood. Participantes: Client UI, FastAPI /analyze, Text Normalizer, Sentiment Service, Emotion Service, Fusion Engine, Crisis Detector, Supabase (opcional), Response Builder. Mensajes:

1. Client UI -> /analyze: (texto, selected_moods)
2. /analyze -> Text Normalizer: limpiar texto
3. /analyze -> Sentiment Service: obtener compound score
4. /analyze -> Emotion Service: obtener probabilidades por emociones
5. /analyze -> Keyword Reinforcement: ajustar distribución
6. /analyze -> Crisis Detector: evaluar crisis indicators
7. /analyze -> Fusion Engine: calcular α dinámico + q_user + p_final
8. /analyze -> Response Builder: construir AnalysisResponse
9. /analyze -> Client UI: devolver JSON.
   Estilo: claro y con 9-10 mensajes.”

---

### 3.2 Diseño del Fusion Engine (núcleo matemático)

#### Entradas

- p_model: distribución del modelo (emoción -> probabilidad %)
- selected_moods: emociones elegidas por el usuario
- r: fiabilidad base del usuario

#### Salidas

- p_final: distribución fusionada
- α_usado
- mood final (argmax)

#### Pasos internos

1. Normalizar p_model a sum=1
2. Entropía normalizada H_norm
3. α dinámico con curva suave
4. Soft voting: q_user asigna r por emoción seleccionada y reparte el resto
5. Fusión lineal
6. Conciliación por empate top1/top2 si selected_moods coincide con top2 cercano
7. Argmax final + confianza

#### Prompt para diagrama de actividad (Activity Diagram)

“Genera un Activity Diagram UML para el Fusion Engine de MindMood. Nodos:
Start -> Load p_model -> Normalize -> Compute Entropy H_norm -> Compute α -> Build q_user (selected_moods, r) -> Compute p_final -> Check Conflict (user picked top2 close?) -> If conflict then boost α and recompute -> Determine final mood (argmax) -> Compute confidence -> End.
Incluye guardas: delta_conflicto y boost_conflicto. 1920x1080.”

---

### 3.3 Diseño de crisis

- Crisis se activa si:
  - has_crisis_indicators(text_lower) == True
  - O si la fusión/selección lleva a Crisis

- En crisis:
  - requires_help = True
  - crisis_level = critical
  - distribución se puede forzar a Crisis (según el diseño actual)

---

### 3.4 Diseño de UI/UX (pantallas clave)

#### Pantallas

- Login/Registro
- Nueva entrada (NewEntry)
- Modal de análisis (EmotionModal)
- Historial (History)
- Estadísticas (Stats)
- Admin Dashboard (AdminDashboard)

#### Admin Dashboard (funciones)

- Sección incidentes: Activas / En Proceso / Resueltas
- Search dentro de incidentes
- Botón Contactar
- Gráficas globales (donut/pie + bar global, sin datos “inventados”)

---

## 4) Code Review (individual)

> Aquí se deja un “template” para que cada integrante complete su parte. Si quieres, en el siguiente mensaje te lo adapto con los nombres y módulos exactos que trabajó cada quien.

### 4.1 Plantilla por integrante

**Integrante:** (Nombre)

**Módulo(s) revisado(s):**

- (Ej. Backend Fusion Engine)
- (Ej. AdminDashboard charts)

**Fortalezas observadas:**

- (Ej. uso de entropía para α)
- (Ej. normalización de distribución y clamps)

**Problemas potenciales / bugs detectados:**

- (Ej. manejo de distribution vacía)
- (Ej. RLS/policies incompletas)

**Mejoras propuestas (acciones concretas):**

- (Ej. agregar clamps y normalizaciones adicionales)
- (Ej. asegurar que el frontend renderiza fallback)

**Impacto en calidad del sistema:**

- (Ej. confiabilidad, UX, seguridad)

**Recomendaciones para la siguiente iteración:**

- (Ej. tests unitarios de fusión)

---

## 5) Diagrama set adicional (recomendado)

Para aumentar la nota, puedes agregar:

1. **Diagrama de datos (ERD)**
2. **Diagrama de secuencia: Contactar admin**
3. **Diagrama de secuencia: update status incident**

### ERD prompt

“Genera un diagrama ER (Entidad-Relación) UML para MindMood con entidades: profiles (id, role, streak, theme, lang, contact\_\*), entries (id, user_id, text, mood, score, selected_moods, distribution, requires_help, status, created_at), contact_requests (id, user_id, admin_id, entry_id, initiator, status, message, admin_response, created_at). Indica PK y FK. Añade cardinalidad 1:N profiles->entries y profiles->contact_requests, entries->contact_requests opcional. Estilo clean.”

---

## 6) Entregables sugeridos

- Imágenes/diagramas exportados en PNG/SVG:
  - Context diagram
  - Container diagram
  - Component diagram (backend)
  - Deployment diagram
  - Sequence diagram (Analyze)
  - Activity diagram (Fusion)
  - ERD

- Sección “Architecture” en el reporte con:
  - descripciones + decisiones + prompts de diagramas

---

Si quieres, en el siguiente paso puedo:

- Insertar automáticamente estas secciones dentro de **Reporte_Proyecto_MindMood.md**
- o generar 4-6 prompts extra por cada diagrama (variante para diferente estilo: C4, UML, SysML).
