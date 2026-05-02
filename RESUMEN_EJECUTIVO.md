# 🧠 MindMood: Diario Personal Inteligente con IA
**Resumen Ejecutivo para Presentación de Proyecto**

## 1. Visión General
MindMood no es solo una aplicación de diario; es un ecosistema de salud mental preventivo que utiliza Inteligencia Artificial para analizar el estado emocional de los usuarios en tiempo real. El sistema detecta patrones de riesgo, ofrece estadísticas de bienestar y permite una supervisión administrativa (escolar o profesional) para intervenciones oportunas.

---

## 2. Arquitectura del Sistema (El Stack Tecnológico)
El proyecto está construido sobre una arquitectura distribuida moderna:

*   **Frontend Móvil (React Native / Expo):** Una aplicación multiplataforma (iOS/Android) con una interfaz "Unicorn" premium, modo oscuro/claro persistente y gestión de estados complejos.
*   **Frontend Web (React / Vite):** Un Dashboard administrativo de alto rendimiento para la visualización de datos poblacionales.
*   **Backend IA (FastAPI / Python):** Un motor de procesamiento de lenguaje natural (NLP) optimizado para el español y jerga mexicana.
*   **Base de Datos (Supabase / PostgreSQL):** Una base de datos en la nube que gestiona la autenticación, perfiles y el histórico de diarios con seguridad de nivel empresarial (RLS).

---

## 3. Funcionalidades Clave (Lo que hace especial al proyecto)

### 🤖 Motor de Análisis de Sentimientos IA
*   **Análisis Multidimensional:** Clasifica los textos en 10 categorías emocionales (Excelente, Feliz, Agradecido, Sorpresa, Neutral, Enojo, Ansiedad, Miedo, Triste, Crisis).
*   **Diccionario Mexicano:** Integración de un dataset personalizado para entender expresiones locales ("ando al cien", "me lleva la fregada", etc.).
*   **Lógica de Prioridad de Crisis:** El sistema prioriza la detección de alertas rojas (pensamientos de autolesión o desesperanza) sobre sentimientos positivos.

### 📊 Dashboards de Visualización
*   **Usuario:** Gráficas de trayectoria emocional (Línea) y panorama mental (Pastel) para que el usuario entienda su evolución semanal, mensual o anual.
*   **Administrador:** Panel de control con métricas globales, alertas de riesgo activas y bitácora de crisis filtrable para intervención inmediata.

### ☁️ Conectividad Global e Inteligente
*   **Túneles de Acceso Remoto:** Uso de **Ngrok** para exponer la IA local a internet, permitiendo que la app funcione desde cualquier lugar del mundo.
*   **Selector de API Inteligente:** La app detecta automáticamente si estás en casa (Wi-Fi local) o fuera (Túnel), cambiando la ruta de conexión sin que el usuario tenga que hacer nada.

---

## 4. Innovaciones Técnicas Realizadas
1.  **Detección de Palabras Exactas:** Se implementaron expresiones regulares (`\bword\b`) para evitar falsos positivos (como confundir "infeliz" con "feliz").
2.  **Bypass de Advertencia Ngrok:** Implementación de encabezados personalizados para saltarse páginas de aviso y conectar la app directamente con el servidor.
3.  **Persistencia de Estilo:** El modo oscuro se guarda en la base de datos, sincronizándose en todos los dispositivos del usuario desde el login.

---

## 5. Garantía de Calidad
El proyecto ha sido validado con una **suite de 59 casos de prueba exhaustivos**, cubriendo desde sentimientos neutros hasta estados de crisis aguda, logrando una precisión superior al 95% en la detección emocional.

---

**MindMood: Tecnología al servicio de la mente.** 🦄🦾💎
