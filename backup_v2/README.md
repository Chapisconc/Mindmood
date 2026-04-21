# 📔 Diario Personal Inteligente

> Aplicación Python de diario personal con análisis avanzado de sentimientos usando **VADER + NLTK**, interfaz **Streamlit** y persistencia **SQLite**.

---

## 🚀 Inicio Rápido

### 1. Requisitos previos
- Python 3.10 o superior
- pip

### 2. Crear entorno virtual (recomendado)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Descargar recursos NLTK (automático al primer uso)
La aplicación descarga automáticamente `punkt` y `punkt_tab` en el primer inicio.
Si prefieres hacerlo manualmente:
```python
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"
```

### 5. Ejecutar la aplicación
```bash
streamlit run app.py
```

La app se abrirá automáticamente en `http://localhost:8501`.

---

## 📁 Estructura del Proyecto

```
diario_inteligente/
│
├── app.py                ← Interfaz Streamlit (3 secciones)
├── sentiment_analysis.py ← Motor VADER + sistema de puntuación propio
├── database.py           ← Capa SQLite (CRUD completo)
├── statistics.py         ← Estadísticas avanzadas + regresión lineal
├── text_processing.py    ← Tokenización NLTK + palabras emocionales
├── utils.py              ← Helpers, formateo, colores
├── requirements.txt
├── README.md
└── data/
    └── diario.db         ← Creada automáticamente
```

---

## 🧠 Fundamento Matemático

### ¿Cómo funciona VADER?

VADER combina un **léxico valorado** (~7500 tokens con puntuación en [-4, 4]) con **reglas heurísticas**:
- **Mayúsculas** → aumenta intensidad
- **Signos de exclamación ("!!!")** → incrementa positividad
- **Negadores** ("not good") → invierte signo y reduce 0.74 unidades
- **Amplificadores** ("very", "extremely") → ±0.293 al score

### El Compound Score

```
         x
c = ────────────    donde x = Σpos_i − Σ|neg_i|,  α = 15
       √(x² + α)
```

- c ∈ **[-1, 1]**
- c ≥ 0.05 → positivo
- c ≤ -0.05 → negativo
- resto → neutro

### Sistema de Puntuación Propio (CustomMoodScore)

Dada una entrada con n oraciones y compound scores C = [c₁, …, cₙ]:

| Símbolo | Definición |
|---------|-----------|
| μ | mean(C) — promedio compound |
| Im | max(|cᵢ|) — intensidad máxima |
| ρ | neg\_count / n — proporción de oraciones negativas |
| Ev | σ / (|μ| + ε) — variabilidad emocional relativa |

**Fórmula:**
```
S = 0.50·μ  +  0.20·Im·sign(μ)  −  0.20·ρ  −  0.10·Ev
```

S ∈ [-1, 1] (con clip final).

**Clasificación:**

| Etiqueta | Rango de S |
|----------|-----------|
| 🌟 Muy bueno | S ≥ 0.50 |
| 😊 Bueno | 0.10 ≤ S < 0.50 |
| 😐 Regular | -0.10 < S < 0.10 |
| 😔 Malo | -0.50 ≤ S ≤ -0.10 |
| 😢 Muy malo | S < -0.50 |

### Índice de Estabilidad Emocional (ISE)

```
ISE = 1 − (σ_global / 2)
```

- σ_global = desviación estándar de todos los compound_mean históricos
- ISE ∈ [0, 1]: 1.0 = perfectamente estable

### Tendencia General (Regresión Lineal)

```
ŷᵢ = β₁·xᵢ + β₀
```

Calculada con `numpy.polyfit` (mínimos cuadrados).  
β₁ > 0 → tendencia mejorando | β₁ < 0 → tendencia empeorando.

### Detección de Cambios Bruscos

```
shift_i = |c_{i+1} − c_i|    →   brusco si shift_i > 0.5
```

### Texto Contradictorio

```
contradictorio = (pos_ratio > 0.25) AND (neg_ratio > 0.25)
```

---

## 📊 Secciones de la App

| Sección | Contenido |
|---------|-----------|
| ✍️ Nueva Entrada | Editor de texto libre + análisis VADER completo + opción de guardar |
| 📖 Historial | Lista filtrable de entradas + detalle expandible + borrar |
| 📊 Estadísticas | KPIs, distribución de ánimo, evolución temporal, variabilidad, promedios semanales/mensuales, mapa de calor |

---

## 🛠️ Tecnologías

| Biblioteca | Uso |
|-----------|-----|
| `vaderSentiment` | Análisis de sentimientos |
| `nltk` | Tokenización en oraciones |
| `numpy / pandas` | Cálculos estadísticos |
| `matplotlib` | Gráficas |
| `streamlit` | Interfaz web |
| `sqlite3` | Base de datos (stdlib) |

---

## 🔒 Privacidad

Todos los datos se almacenan **localmente** en `data/diario.db`.  
No se realiza ninguna llamada a APIs externas.

---

*Desarrollado como proyecto de NLP educativo — 100% gratuito y de código abierto.*
