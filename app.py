"""
app.py — Interfaz Streamlit para el Diario Personal Inteligente.

Secciones:
  1. ✍️  Nueva Entrada  — Escribir y analizar texto
  2. 📖  Historial      — Ver y eliminar entradas anteriores
  3. 📊  Estadísticas   — Gráficas intuitivas del estado emocional

Diseño:
  - Interfaz minimalista y moderna
  - Paleta de colores suaves
  - Visualizaciones intuitivas sin datos complejos
"""

import streamlit as st
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from datetime import datetime

# Módulos internos
import database as db
import sentiment_analysis as sa
import statistics as stats_module
from utils import (
    validate_entry, format_datetime, format_compound, format_score,
    compound_to_color, truncate_text, stability_label, score_bar,
    MOOD_COLORS, MOOD_EMOJIS, MOOD_ORDER, DISTRIBUTION_PALETTE,
    COMPOUND_CMAP,
)
from sentiment_analysis import EMOTION_LABELS_ES, EMOTION_COLORS


# Configuración de página
st.set_page_config(
    page_title="Diario Personal Inteligente",
    page_icon="📔",
    layout="wide",
    initial_sidebar_state="expanded",
)

# CSS personalizado - Minimalist Light Theme
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* Main background - clean white with light gray accents */
.stApp {
    background-color: #FFFFFF;
    color: #1E293B;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background-color: #F1F5F9;
    border-right: 1px solid #E2E8F0;
}

section[data-testid="stSidebar"] .sidebar-brand {
    color: #1E293B;
}

section[data-testid="stSidebar"] p,
section[data-testid="stSidebar"] span,
section[data-testid="stSidebar"] div {
    color: #334155 !important;
}

/* Text colors for light theme */
p, span, div {
    color: #1E293B !important;
}

/* Headers */
h1, h2, h3, h4 {
    color: #1E293B !important;
    font-weight: 600;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background-color: #F8FAFC;
    border-right: 1px solid #E2E8F0;
}

/* Cards */
.metric-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 1.2rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.metric-card .label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748B;
    margin-bottom: 0.25rem;
}
.metric-card .value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1E293B;
}

.entry-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-left: 4px solid;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.entry-card .meta {
    font-size: 0.78rem;
    color: #94A3B8;
    margin-bottom: 0.4rem;
}

/* Mood pills */
.mood-pill {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    color: white;
    margin-right: 0.4rem;
}

/* Analysis result banner */
.result-banner {
    background: #F8FAFC;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
}
.result-banner .emoji {
    font-size: 3rem;
    margin-bottom: 0.5rem;
}
.result-banner .label {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}
.result-banner .score-text {
    font-size: 0.9rem;
    color: #64748B;
}

/* Headings */
h1, h2, h3 {
    color: #1E293B;
    font-weight: 600;
}

/* Buttons */
div.stButton > button {
    border-radius: 8px;
    font-weight: 500;
}

/* Text area */
div.stTextArea > textarea {
    border-radius: 8px;
    border-color: #E2E8F0;
}

/* Sidebar brand */
.sidebar-brand {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 0.2rem;
}

/* Expander */
.streamlit-expanderHeader {
    background: #F8FAFC;
    border-radius: 8px;
}

/* Info boxes */
div[data-testid="stInfo"] {
    background: #F0F9FF;
    border: 1px solid #BAE6FD;
    border-radius: 8px;
}

div[data-testid="stSuccess"] {
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-radius: 8px;
}

div[data-testid="stError"] {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 8px;
}
</style>
""", unsafe_allow_html=True)

# Inicialización de BD
db.init_db()


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _get_pastel_colors():
    """Returns a soft color palette for emotions."""
    return {
        "Muy bueno": "#10B981",  # Emerald green
        "Bueno": "#34D399",      # Light green
        "Regular": "#FBBF24",    # Amber
        "Malo": "#FB923C",       # Orange
        "Muy malo": "#F87171",   # Light red
    }


def _light_fig(w: float = 6, h: float = 3.5):
    """Creates a figure with light background."""
    fig, ax = plt.subplots(figsize=(w, h))
    fig.patch.set_facecolor("#FFFFFF")
    ax.set_facecolor("#FFFFFF")
    for spine in ax.spines.values():
        spine.set_edgecolor("#E2E8F0")
    ax.tick_params(colors="#64748B", labelsize=9)
    return fig, ax


# ============================================================
# RENDER: NEW ENTRY ANALYSIS
# ============================================================

def render_analysis(analysis: dict) -> None:
    """Muestra el análisis de una entrada de forma intuitiva."""
    st.divider()
    st.subheader("🧠 Análisis de tu Día")

    label = analysis["mood_label"]
    score = analysis["mood_score"]
    color = MOOD_COLORS.get(label, "#888")
    emoji = MOOD_EMOJIS.get(label, "")

    # Banner de resultado principal - limpio y simple
    st.markdown(
        f"""
        <div class="result-banner" style="border: 2px solid {color};">
            <div class="emoji">{emoji}</div>
            <div class="label" style="color: {color};">{label}</div>
            <div class="score-text">
                {analysis['sentence_count']} oraciones analizadas
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Análisis por oración
    sentences = analysis.get("sentences", [])
    if sentences:
        st.markdown("#### 📝 Tu Día en Oraciones")
        
        SENT_COLORS = {
            "positiva": "#10B981",
            "negativa": "#F87171",
            "neutra": "#94A3B8",
        }
        
        for sent in sentences:
            sc = SENT_COLORS.get(sent["label"], "#888")
            st.markdown(
                f"""
                <div style="display: flex; align-items: center; gap: 0.75rem; 
                            margin-bottom: 0.6rem; padding: 0.5rem; 
                            background: #F8FAFC; border-radius: 6px;">
                    <span style="min-width: 70px; font-size: 0.7rem; font-weight: 600;
                                 padding: 0.15rem 0.5rem; border-radius: 4px;
                                 background: {sc}; color: white; text-align: center;">
                        {sent['label']}
                    </span>
                    <span style="flex: 1; color: #334155; font-size: 0.9rem;">
                        {sent['text']}
                    </span>
                </div>
                """,
                unsafe_allow_html=True,
            )

    # Emociones detectadas
    emotions = analysis.get("emotions", {})
    if emotions and any(v > 0 for v in emotions.values()):
        st.markdown("#### 🎭 Emociones Detectadas")
        
        sorted_emotions = sorted(emotions.items(), key=lambda item: item[1], reverse=True)
        
        for em, prob in sorted_emotions:
            if prob > 0.05:
                lbl = EMOTION_LABELS_ES.get(em, em)
                emotion_color = EMOTION_COLORS.get(em, "#64748B")
                st.markdown(
                    f"""
                    <div style="margin-bottom: 0.6rem;">
                        <div style="display: flex; justify-content: space-between; 
                                    font-size: 0.85rem; margin-bottom: 0.2rem; color: #334155;">
                            <span>{lbl}</span>
                            <span style="font-weight: 500;">{prob*100:.0f}%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background-color: #E2E8F0; 
                                    border-radius: 4px; overflow: hidden;">
                            <div style="width: {prob*100}%; height: 100%; 
                                        background-color: {emotion_color}; border-radius: 4px;"></div>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )


# ============================================================
# RENDER: HISTORY CARD
# ============================================================

def render_entry_card(entry: dict) -> None:
    """Renderiza una tarjeta de entrada en el historial."""
    label = entry.get("mood_label", "?")
    color = MOOD_COLORS.get(label, "#888")
    emoji = MOOD_EMOJIS.get(label, "")
    date_f = format_datetime(entry.get("created_at", ""))

    st.markdown(
        f"""
        <div class="entry-card" style="border-left-color: {color};">
            <div class="meta">#{entry['id']} · {date_f}</div>
            <span class="mood-pill" style="background: {color};">{emoji} {label}</span>
            <p style="color: #475569; margin-top: 0.6rem; margin-bottom: 0; font-size: 0.9rem;">
                {truncate_text(entry['text'], 200)}
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col_detail, col_del = st.columns([1, 1])
    key_s = f"show_{entry['id']}"

    with col_detail:
        if st.button("👁 Ver más", key=f"btn_detail_{entry['id']}"):
            st.session_state[key_s] = not st.session_state.get(key_s, False)
    with col_del:
        if st.button("🗑 Borrar", key=f"btn_del_{entry['id']}"):
            db.delete_entry(entry["id"])
            st.rerun()

    if st.session_state.get(key_s, False):
        with st.expander(f"Entrada #{entry['id']}", expanded=True):
            st.write(entry["text"])


# ============================================================
# RENDER: STATISTICS - INTUITIVE
# ============================================================

def render_statistics(stats: dict, entries: list[dict]) -> None:
    """Panel de estadísticas con visualizaciones intuitivas."""

    # Header simple
    st.markdown("### 📊 Tu Estado Emocional")

    # KPIs simples - solo lo esencial
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Total de Entradas", stats["total_entries"])
    with c2:
        # Mood predominante
        dist = stats["mood_distribution"]
        if any(dist.values()):
            dominant = max(dist, key=dist.get)
            emoji = MOOD_EMOJIS.get(dominant, "")
            st.metric("Estado más común", f"{emoji} {dominant}")
    with c3:
        # Tendencia
        trend = stats["linear_trend"]
        st.metric("Tendencia", trend["trend_label"])

    st.divider()

    # Fila 1: Distribución + Evolución
    col_a, col_b = st.columns(2)

    with col_a:
        st.markdown("#### 📊 ¿Cómo te has sentido?")
        dist = stats["mood_distribution"]
        labels = list(dist.keys())
        values = list(dist.values())
        total_v = sum(values) or 1

        if total_v > 0:
            fig, ax = _light_fig(5, 3.5)
            
            # Donut chart
            colors = [_get_pastel_colors()[l] for l in labels]
            wedges, texts, autotexts = ax.pie(
                values, 
                labels=labels,
                colors=colors,
                autopct='%1.0f%%',
                startangle=90,
                pctdistance=0.75,
                wedgeprops=dict(width=0.5, edgecolor='white', linewidth=2)
            )
            
            # Style the labels
            for text in texts:
                text.set_fontsize(9)
                text.set_color('#334155')
            for autotext in autotexts:
                autotext.set_fontsize(8)
                autotext.set_color('white')
                autotext.set_weight('bold')
            
            ax.set_title("Distribución de estados", color="#334155", fontsize=10, pad=10)
            plt.tight_layout()
            st.pyplot(fig)
            plt.close(fig)
        else:
            st.info("Sin datos aún")

    with col_b:
        st.markdown("#### 📈 Evolución de tu Ánimo")
        evo = stats["temporal_evolution"]

        if len(evo) >= 2:
            fig, ax = _light_fig(5, 3.5)
            x_idx = range(len(evo))
            y_evo = evo["compound_mean"].values

            # Area chart with gradient effect
            ax.fill_between(x_idx, y_evo, alpha=0.3, color="#818CF8")
            ax.plot(x_idx, y_evo, color="#818CF8", linewidth=2.5, 
                   marker="o", markersize=5, label="Tu estado")

            # Trend line
            tl = trend["trend_line"]
            if len(tl) == len(evo):
                trend_color = "#10B981" if trend["trend_label"].find("Mejorando") >= 0 else "#F87171" if trend["trend_label"].find("Empeorando") >= 0 else "#94A3B8"
                ax.plot(x_idx, tl, color=trend_color, linewidth=1.5,
                       linestyle="--", label="Tendencia")

            ax.axhline(0, color="#CBD5E1", linewidth=1)
            ax.set_ylim(-1.05, 1.05)
            ax.set_xlabel("Días", color="#64748B", fontsize=9)
            ax.set_ylabel("Ánimo", color="#64748B", fontsize=9)
            ax.legend(fontsize=8, facecolor="white", labelcolor="#334155", loc="lower right")
            ax.set_title("Tu evolución emocional", color="#334155", fontsize=10, pad=10)
            plt.tight_layout()
            st.pyplot(fig)
            plt.close(fig)
        else:
            st.info("Necesitas más entradas para ver la evolución")

    st.divider()

    # Mapa de calor
    render_heatmap(entries)


def render_heatmap(entries: list[dict]) -> None:
    """Mapa de calor tipo calendario del estado emocional."""
    if len(entries) < 5:
        return
    
    st.markdown("#### 🗓️ Tu Mes Emocional")

    df = pd.DataFrame(entries)
    df["entry_date"] = pd.to_datetime(df["entry_date"])
    df["compound_mean"] = pd.to_numeric(df["compound_mean"], errors="coerce")
    daily = df.groupby("entry_date")["compound_mean"].mean()

    full_range = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    daily = daily.reindex(full_range)

    n_days = len(full_range)
    n_weeks = (n_days // 7) + 1
    grid = np.full((7, n_weeks), np.nan)

    for i, val in enumerate(daily.values):
        week = i // 7
        day = i % 7
        if week < n_weeks:
            grid[day, week] = val

    w = min(n_weeks * 0.4 + 1.5, 14)
    fig, ax = plt.subplots(figsize=(w, 2.5))
    fig.patch.set_facecolor("#FFFFFF")
    ax.set_facecolor("#FFFFFF")

    im = ax.imshow(
        grid, cmap="RdYlGn", aspect="auto",
        vmin=-1, vmax=1, origin="upper", interpolation="nearest"
    )
    ax.set_yticks(range(7))
    ax.set_yticks(range(7))
    ax.set_yticklabels(["L", "M", "X", "J", "V", "S", "D"],
                       color="#64748B", fontsize=8)
    ax.set_xticks([])
    ax.set_title(
        "Verde = positivo · Rojo = negativo",
        color="#94A3B8", fontsize=8, pad=5
    )
    cbar = plt.colorbar(im, ax=ax, orientation="vertical", fraction=0.03, pad=0.02)
    cbar.set_label("Ánimo", color="#64748B", fontsize=8)
    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)


# ============================================================
# MAIN NAVIGATION
# ============================================================

def main() -> None:
    """Punto de entrada principal."""

    # Sidebar
    with st.sidebar:
        st.markdown('<div class="sidebar-brand">📔 Diario Inteligente</div>',
                    unsafe_allow_html=True)
        st.caption("Análisis de sentimientos con IA")
        st.divider()
        
        # Botón para generar datos de prueba
        if st.button("🎲 Generar Datos de Prueba", use_container_width=True):
            with st.spinner("Generando datos..."):
                db.generate_synthetic_data(25)
            st.success("¡Datos generados! Refresca la página.")
            st.rerun()
        
        st.divider()
        
        section = st.radio(
            "Navegar a:",
            ["✍️ Nueva Entrada", "📖 Historial", "📊 Estadísticas"],
            label_visibility="collapsed",
        )
        st.divider()
        st.metric("Entradas totales", db.count_entries())

    # === SECCIÓN 1: NUEVA ENTRADA ===
    if section == "✍️ Nueva Entrada":
        st.title("✍️ Nueva Entrada")
        st.markdown(f"*{datetime.now().strftime('%A %d de %B de %Y')}*")
        st.divider()

        text_input = st.text_area(
            "¿Cómo te sientes hoy?",
            height=180,
            placeholder="Escribe sobre tu día, emociones, logros o preocupaciones...",
            key="entry_text",
        )

        col1, col2 = st.columns([1, 4])
        with col1:
            submitted = st.button("💾 Guardar y Analizar", type="primary",
                                 use_container_width=True)
        with col2:
            preview = st.button("🔍 Solo Analizar")

        if submitted or preview:
            ok, err = validate_entry(text_input)
            if not ok:
                st.error(err)
            else:
                with st.spinner("Analizando con IA..."):
                    analysis = sa.analyze_entry(text_input)

                if submitted:
                    entry_id = db.save_entry(text_input, analysis)
                    st.success(f"✅ Entrada #{entry_id} guardada.")

                render_analysis(analysis)

    # === SECCIÓN 2: HISTORIAL ===
    elif section == "📖 Historial":
        st.title("📖 Mi Historial")
        st.divider()

        entries = db.get_all_entries(limit=100)
        if not entries:
            st.info("No hay entradas aún. ¡Escribe tu primera nota! ✍️")
            st.stop()

        # Filtros simples
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            mood_filter = st.multiselect(
                "Filtrar por estado:",
                MOOD_ORDER, default=MOOD_ORDER,
            )
        with col_f2:
            search_term = st.text_input("🔎 Buscar:", "")

        filtered = [
            e for e in entries
            if e.get("mood_label") in mood_filter
            and (not search_term or search_term.lower() in e["text"].lower())
        ]
        
        st.caption(f"Mostrando {len(filtered)} de {len(entries)} entradas")

        for entry in filtered:
            render_entry_card(entry)

    # === SECCIÓN 3: ESTADÍSTICAS ===
    else:
        st.title("📊 Mis Estadísticas")
        st.divider()

        entries = db.get_all_entries(limit=500)
        if len(entries) < 2:
            st.info("Necesitas al menos **2 entradas** para ver estadísticas. ✍️")
            st.stop()

        stats = stats_module.compute_all_stats(entries)
        render_statistics(stats, entries)


# Entry point
if __name__ == "__main__" or True:
    main()

