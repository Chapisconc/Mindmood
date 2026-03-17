"""
Diario Inteligente - Aplicación de Análisis de Sentimientos

Características:
- Análisis de sentimientos con IA (pysentimiento)
- Tema claro/oscuro
- Gráficos interactivos con Plotly
- Autenticación de usuarios
- Exportación a PDF/CSV
- Diseño responsive
"""

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

# Optional imports (with fallbacks)
try:
    import plotly.express as px
    import plotly.graph_objects as go
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    go = None
    px = None

try:
    from streamlit_authenticator import Authenticate
    AUTH_AVAILABLE = True
except ImportError:
    AUTH_AVAILABLE = False

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

# Módulos internos
import database as db
import sentiment_analysis as sa
import statistics as stats_module
from utils import (
    validate_entry, format_datetime, truncate_text,
    MOOD_COLORS, MOOD_EMOJIS, MOOD_ORDER,
)
from sentiment_analysis import EMOTION_LABELS_ES, EMOTION_COLORS


# ============================================================
# CONFIGURACIÓN DE PÁGINA
# ============================================================

st.set_page_config(
    page_title="Diario Inteligente",
    page_icon="📔",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ============================================================
# CSS PERSONALIZADO - TEMA DINÁMICO
# ============================================================

def get_css(theme: str = "light") -> str:
    """Retorna el CSS según el tema seleccionado."""
    
    if theme == "dark":
        return """
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
    --primary: #818CF8;
    --primary-light: #A5B4FC;
    --secondary: #F472B6;
    --success: #34D399;
    --warning: #FBBF24;
    --danger: #F87171;
    --background: #0F172A;
    --surface: #1E293B;
    --surface-hover: #334155;
    --text-primary: #F1F5F9;
    --text-secondary: #CBD5E1;
    --text-muted: #94A3B8;
    --border: #334155;
    --shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
}

html, body, [class*="css"] {
    font-family: 'Outfit', sans-serif;
    background: var(--background);
    color: var(--text-primary);
}

.stApp {
    background: var(--background);
}

section[data-testid="stSidebar"] {
    background: var(--surface);
    border-right: 1px solid var(--border);
}

/* Texto principal en modo oscuro - BLANCO */
.stMarkdown, .stMarkdown p, p {
    color: var(--text-primary) !important;
}

/* Títulos en modo oscuro */
h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary) !important;
}

/* Labels y textos de input */
.stTextInput label, .stTextArea label, .stSelectbox label, 
.stMultiselect label, .stSlider label, .stRadio label, 
.stCheckbox label, .stToggle label, label {
    color: var(--text-primary) !important;
}

/* Input fields */
.stTextInput > div > div > input, 
.stTextArea > div > div > textarea,
.stSelectbox > div > div > div {
    background: var(--surface) !important;
    color: var(--text-primary) !important;
    border-color: var(--border) !important;
}

/* Placeholder text */
input::placeholder, textarea::placeholder {
    color: var(--text-muted) !important;
}

/* Botones primarios */
div.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
    color: white !important;
}

/* Todos los botones */
div.stButton > button {
    background: var(--surface) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border) !important;
}

/* Expander */
.streamlit-expanderHeader {
    background: var(--surface) !important;
    color: var(--text-primary) !important;
}

/* Metrics */
[data-testid="stMetricValue"] {
    color: var(--text-primary) !important;
}

[data-testid="stMetricLabel"] {
    color: var(--text-secondary) !important;
}

/* Divider */
hr {
    border-color: var(--border) !important;
}

/* Info, Success, Warning, Error messages */
div[data-testid="stInfo"],
div[data-testid="stSuccess"],
div[data-testid="stWarning"],
div[data-testid="stError"] {
    background: var(--surface) !important;
    color: var(--text-primary) !important;
}

/* Tarjetas */
.modern-card, .metric-card, .entry-card {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-primary);
}

/* Result banner para modo oscuro */
.result-banner {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
}

/* Sidebar */
.sidebar-brand {
    color: var(--text-primary) !important;
}

/* Radio buttons */
div[data-testid="stRadio"] > div {
    color: var(--text-primary) !important;
}

/* Multiselect */
div[data-testid="stMultiselect"] > div > div {
    background: var(--surface) !important;
    color: var(--text-primary) !important;
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
</style>
"""
    else:
        return """
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
    --primary: #6366F1;
    --primary-light: #818CF8;
    --secondary: #EC4899;
    --success: #10B981;
    --warning: #F59E0B;
    --danger: #EF4444;
    --background: #FAFAFA;
    --surface: #FFFFFF;
    --surface-hover: #F8FAFC;
    --text-primary: #1E293B;
    --text-secondary: #64748B;
    --text-muted: #94A3B8;
    --border: #E2E8F0;
    --shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

* { box-sizing: border-box; }

html, body, [class*="css"] {
    font-family: 'Outfit', sans-serif;
    background: var(--background);
    color: var(--text-primary);
}

.stApp {
    background: var(--background);
    background-image: 
        radial-gradient(circle at 20% 80%, rgba(99,102,241,0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(236,72,153,0.05) 0%, transparent 50%);
}

section[data-testid="stSidebar"] {
    background: var(--surface);
    border-right: 1px solid var(--border);
}

.modern-card {
    background: var(--surface);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
    transition: all 0.3s ease;
}

.modern-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

.metric-card {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
}

.entry-card {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
    transition: all 0.3s ease;
}

.entry-card:hover {
    transform: translateX(4px);
}

.result-banner {
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 2rem;
    border: 1px solid rgba(255,255,255,0.5);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    text-align: center;
}

.sidebar-brand {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

h1, h2, h3, h4 {
    color: var(--text-primary);
    font-weight: 600;
    letter-spacing: -0.02em;
}

div.stButton > button {
    border-radius: 12px;
    font-weight: 500;
    padding: 0.6rem 1.25rem;
    border: none;
    transition: all 0.2s ease;
}

div.stButton > button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

div.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: white;
}

/* Mobile */
@media (max-width: 768px) {
    .stApp { padding: 0.5rem; }
    .modern-card, .result-banner { padding: 1rem; }
}

::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
</style>
"""


# ============================================================
# AUTENTICACIÓN
# ============================================================

def init_auth():
    """Inicializa el sistema de autenticación."""
    if not AUTH_AVAILABLE:
        return None
    
    # Configuración de usuarios (en producción, usar base de datos)
    authenticator = Authenticate(
        credentials={
            'usernames': {
                'admin': {
                    'name': 'Administrador',
                    'password': 'admin123'  # Cambiar en producción
                }
            }
        },
        cookie_name='diario_inteligente',
        cookie_key='diario_secret_key',
        cookie_expiry_days=30
    )
    return authenticator


# ============================================================
# EXPORTACIÓN
# ============================================================

def export_to_csv(entries: list[dict]) -> str:
    """Exporta las entradas a CSV."""
    if not entries:
        return ""
    
    df = pd.DataFrame(entries)
    df['created_at'] = pd.to_datetime(df['created_at'])
    df = df.sort_values('created_at', ascending=False)
    
    return df.to_csv(index=False).encode('utf-8')


def export_to_pdf(entries: list[dict]):
    """Exporta las entradas a PDF - versión simplificada sin acentos."""
    if not FPDF_AVAILABLE:
        return None
    
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        pdf.set_font("Arial", "B", 16)
        pdf.cell(200, 10, txt="Mi Diario Inteligente", ln=1, align="C")
        pdf.ln(10)
        
        pdf.set_font("Arial", size=10)
        
        for entry in entries[:20]:  # Limitar a 20 entradas
            pdf.set_font("Arial", "B", 11)
            date = format_datetime(entry.get('created_at', ''))
            # Usar ASCII seguro
            date_safe = date.encode('ascii', 'ignore').decode('ascii')
            pdf.cell(200, 8, txt=f"Entrada #{entry['id']} - {date_safe}", ln=1)
            
            mood = entry.get('mood_label', 'Regular')
            emoji = MOOD_EMOJIS.get(mood, '')
            pdf.set_font("Arial", size=10)
            pdf.cell(200, 6, txt=f"Estado: {emoji} {mood}", ln=1)
            
            text = truncate_text(entry.get('text', ''), 300)
            text_safe = text.encode('ascii', 'ignore').decode('ascii')
            pdf.multi_cell(0, 5, txt=f"Contenido: {text_safe}")
            pdf.ln(5)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(5)
        
        return pdf.output(dest='S').encode('latin-1', errors='ignore')
    except Exception as e:
        # Si falla, retornar None
        return None


# ============================================================
# GRÁFICOS CON PLOTLY
# ============================================================

def render_donut_chart(dist: dict):
    """Gráfico de dona interactivo."""
    if not PLOTLY_AVAILABLE or go is None:
        return None
    labels = list(dist.keys())
    values = list(dist.values())
    colors = [MOOD_COLORS.get(l, '#888') for l in labels]
    
    fig = go.Figure(data=[go.Pie(
        labels=labels, 
        values=values,
        hole=0.6,
        marker=dict(colors=colors),
        textinfo='percent',
        hoverinfo='label+value+percent',
        textposition='inside'
    )])
    
    fig.update_layout(
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=-0.2),
        margin=dict(t=20, b=20, l=20, r=20),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(family="Outfit")
    )
    return fig


def render_line_chart(evo: pd.DataFrame, trend: dict):
    """Gráfico de línea interactivo."""
    if not PLOTLY_AVAILABLE or go is None:
        return None
    fig = go.Figure()
    
    # Área con gradiente
    fig.add_trace(go.Scatter(
        x=list(range(len(evo))),
        y=evo["compound_mean"],
        fill='tozeroy',
        mode='lines',
        name='Estado',
        line=dict(color='#6366F1', width=3),
        fillcolor='rgba(99, 102, 241, 0.3)'
    ))
    
    # Línea de tendencia
    if trend["trend_line"]:
        trend_color = '#10B981' if 'Mejorando' in trend['trend_label'] else '#EF4444' if 'Empeorando' in trend['trend_label'] else '#94A3B8'
        fig.add_trace(go.Scatter(
            x=list(range(len(trend["trend_line"]))),
            y=trend["trend_line"],
            mode='lines',
            name='Tendencia',
            line=dict(color=trend_color, width=2, dash='dash')
        ))
    
    fig.update_layout(
        xaxis_title="Días",
        yaxis_title="Ánimo",
        yaxis_range=[-1.1, 1.1],
        showlegend=True,
        margin=dict(t=20, b=40, l=40, r=20),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(family="Outfit")
    )
    return fig


def render_heatmap(entries: list[dict]):
    """Mapa de calor interactivo."""
    if not PLOTLY_AVAILABLE or go is None:
        return None
    if len(entries) < 5:
        return None
    
    df = pd.DataFrame(entries)
    df["entry_date"] = pd.to_datetime(df["entry_date"])
    df = df.sort_values("entry_date")
    
    daily = df.groupby("entry_date")["compound_mean"].mean()
    
    fig = go.Figure(data=go.Heatmap(
        z=daily.values,
        x=[d.strftime('%Y-%m-%d') for d in daily.index],
        colorscale='RdYlGn',
        zmin=-1, zmax=1,
        colorbar=dict(title="Ánimo")
    ))
    
    fig.update_layout(
        xaxis_title="Fecha",
        yaxis_title="",
        margin=dict(t=20, b=40, l=40, r=20),
        paper_bgcolor='rgba(0,0,0,0)',
        font=dict(family="Outfit")
    )
    return fig


# ============================================================
# WIDGETS DE COMPARTIR
# ============================================================

def render_share_widget(entries_count: int, dominant_mood: str) -> None:
    """Widget de compartir en redes sociales."""
    st.markdown("### 🔗 Compartir")
    
    # Simulated share buttons
    share_text = f" llevo {entries_count} dias escribiendo en mi Diario Inteligente! Mi estado mas comun es {dominant_mood}"
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f"""
            <a href="https://twitter.com/intent/tweet?text={share_text}" target="_blank" 
               style="display: inline-block; padding: 0.5rem 1rem; background: #1DA1F2; 
                      color: white; border-radius: 8px; text-decoration: none; text-align: center;">
               Twitter
            </a>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown(f"""
            <a href="https://www.facebook.com/sharer/sharer.php?u=example.com" target="_blank"
               style="display: inline-block; padding: 0.5rem 1rem; background: #4267B2;
                      color: white; border-radius: 8px; text-decoration: none; text-align: center;">
               Facebook
            </a>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown(f"""
            <a href="https://wa.me/?text={share_text}" target="_blank"
               style="display: inline-block; padding: 0.5rem 1rem; background: #25D366;
                      color: white; border-radius: 8px; text-decoration: none; text-align: center;">
               WhatsApp
            </a>
        """, unsafe_allow_html=True)


# ============================================================
# RENDERIZADO DE ANÁLISIS
# ============================================================

def render_analysis(analysis: dict) -> None:
    """Muestra el análisis de una entrada."""
    st.divider()
    st.subheader("✨ Análisis de tu Día")

    label = analysis["mood_label"]
    color = MOOD_COLORS.get(label, "#888")
    emoji = MOOD_EMOJIS.get(label, "")

    st.markdown(
        f"""
        <div class="result-banner">
            <div style="font-size: 4rem;">{emoji}</div>
            <div style="font-size: 1.75rem; font-weight: 700; color: {color};">{label}</div>
            <div style="color: var(--text-secondary);">{analysis['sentence_count']} oraciones analizadas</div>
        """,
        unsafe_allow_html=True,
    )

    # Emociones
    emotions = analysis.get("emotions", {})
    if emotions and any(v > 0 for v in emotions.values()):
        st.markdown("### 🎭 Emociones")
        
        sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)
        
        for em, prob in sorted_emotions:
            if prob > 0.05:
                lbl = EMOTION_LABELS_ES.get(em, em)
                emotion_color = EMOTION_COLORS.get(em, "#64748B")
                st.markdown(
                    f"""
                    <div style="margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span>{lbl}</span>
                            <span>{prob*100:.0f}%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px;">
                            <div style="width: {prob*100}%; height: 100%; background: {emotion_color}; border-radius: 4px;"></div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )


def render_entry_card(entry: dict) -> None:
    """Renderiza tarjeta de entrada."""
    label = entry.get("mood_label", "?")
    color = MOOD_COLORS.get(label, "#888")
    emoji = MOOD_EMOJIS.get(label, "")
    date_f = format_datetime(entry.get("created_at", ""))

    st.markdown(
        f"""
        <div class="entry-card" style="border-left: 4px solid {color};">
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                #{entry['id']} · {date_f}
            </div>
            <span style="display: inline-flex; align-items: center; gap: 0.4rem; 
                         padding: 0.35rem 0.85rem; border-radius: 50px; 
                         font-size: 0.8rem; font-weight: 500; color: white; background: {color};">
                {emoji} {label}
            </span>
            <p style="color: var(--text-secondary); margin-top: 0.75rem; font-size: 0.9rem;">
                {truncate_text(entry['text'], 180)}
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col1, col2 = st.columns(2)
    with col1:
        if st.button("👁 Ver más", key=f"btn_{entry['id']}", use_container_width=True):
            st.session_state[f"show_{entry['id']}"] = not st.session_state.get(f"show_{entry['id']}", False)
    with col2:
        if st.button("🗑 Eliminar", key=f"del_{entry['id']}", use_container_width=True):
            db.delete_entry(entry["id"])
            st.rerun()

    if st.session_state.get(f"show_{entry['id']}", False):
        with st.expander("Ver contenido completo"):
            st.write(entry["text"])


def render_statistics(stats: dict, entries: list[dict]) -> None:
    """Panel de estadísticas."""
    if not PLOTLY_AVAILABLE:
        st.warning("Plotly no está instalado. Ejecuta: pip install plotly")
        return

    st.markdown("### 📊 Tu Estado Emocional")

    # KPIs
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Total Entradas", stats['total_entries'])
    with c2:
        dist = stats["mood_distribution"]
        if any(dist.values()):
            dominant = max(dist, key=dist.get)
            emoji = MOOD_EMOJIS.get(dominant, "")
            st.metric("Estado Principal", f"{emoji} {dominant}")
    with c3:
        trend = stats["linear_trend"]
        trend_emoji = "📈" if "Mejorando" in trend["trend_label"] else "📉" if "Empeorando" in trend["trend_label"] else "➡️"
        st.metric("Tendencia", f"{trend_emoji} {trend['trend_label'].replace('📈 ', '').replace('📉 ', '').replace('➡️ ', '')}")

    st.divider()

    # Gráficos
    col_a, col_b = st.columns(2)

    with col_a:
        st.markdown("### 🍩 Distribución")
        if any(stats["mood_distribution"].values()):
            fig = render_donut_chart(stats["mood_distribution"])
            st.plotly_chart(fig, use_container_width=True)

    with col_b:
        st.markdown("### 📈 Evolución")
        evo = stats["temporal_evolution"]
        if len(evo) >= 2:
            fig = render_line_chart(evo, stats["linear_trend"])
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Necesitas más entradas")

    st.divider()

    # Heatmap
    st.markdown("### 🗓️ Mes Emocional")
    fig = render_heatmap(entries)
    if fig:
        st.plotly_chart(fig, use_container_width=True)

    # Compartir
    dist = stats["mood_distribution"]
    dominant = max(dist, key=dist.get) if dist else "Regular"
    render_share_widget(stats['total_entries'], dominant)


# ============================================================
# NOTIFICACIONES
# ============================================================

def render_reminder():
    """Muestra recordatorio de escritura."""
    st.markdown("### ⏰ Recordatorio")
    
    # Verificar última entrada
    entries = db.get_all_entries(limit=1)
    if entries:
        last_date = datetime.strptime(entries[0]['created_at'], '%Y-%m-%d %H:%M:%S')
        days_since = (datetime.now() - last_date).days
        
        if days_since >= 2:
            st.warning(f"📝 Han pasado {days_since} días desde tu última entrada. ¡Cuéntame cómo estás!")
        else:
            st.success(f"✅ Escribiste hace {days_since} día(s). ¡Sigue así!")
    else:
        st.info("👋 ¡Bienvenido! Escribe tu primera entrada.")


# ============================================================
# MAIN
# ============================================================

def main():
    """Función principal."""
    
    # Inicializar tema en session state
    if 'theme' not in st.session_state:
        st.session_state['theme'] = "light"
    
    # Selector de tema
    with st.sidebar:
        st.markdown('<div class="sidebar-brand">📔 Diario Inteligente</div>', 
                    unsafe_allow_html=True)
        
        # Toggle tema
        theme = st.toggle("🌙 Tema Oscuro", value=(st.session_state['theme'] == "dark"))
        st.session_state['theme'] = "dark" if theme else "light"
        
        st.markdown("---")
        
        # Autenticación
        authenticator = init_auth()
        if authenticator:
            authenticator.login()
        else:
            st.caption("Modo demo - Sin autenticación")
        
        st.markdown("---")
        
        # Generar datos
        if st.button("🎲 Generar Datos de Prueba", use_container_width=True):
            with st.spinner("Generando..."):
                db.generate_synthetic_data(25)
            st.success("¡Datos generados!")
            st.rerun()
        
        st.markdown("---")
        
        # Navegación
        section = st.radio("Navegar", 
                          ["✍️ Nueva Entrada", "📖 Mi Historial", "📊 Estadísticas"],
                          label_visibility="collapsed")
        
        st.markdown("---")
        
        # Recordatorio
        render_reminder()
        
        st.markdown("---")
        
        # Exportación
        st.markdown("### 📥 Exportar")
        
        entries = db.get_all_entries(limit=100)
        
        col1, col2 = st.columns(2)
        with col1:
            if entries:
                csv = export_to_csv(entries)
                st.download_button(
                    "📊 CSV",
                    data=csv,
                    file_name="diario_inteligente.csv",
                    mime="text/csv",
                    use_container_width=True
                )
        with col2:
            if entries and FPDF_AVAILABLE:
                pdf = export_to_pdf(entries)
                if pdf:
                    st.download_button(
                        "📄 PDF",
                        data=pdf,
                        file_name="diario_inteligente.pdf",
                        mime="application/pdf",
                        use_container_width=True
                    )
                else:
                    st.caption("PDF no disponible")
        
        st.markdown("---")
        st.metric("Entradas", db.count_entries())

    # Aplicar CSS
    st.markdown(get_css(st.session_state['theme']), unsafe_allow_html=True)

    # Renderizar según sección
    if section == "✍️ Nueva Entrada":
        st.title("✍️ Nueva Entrada")
        st.caption(datetime.now().strftime('%A %d de %B de %Y'))
        
        text_input = st.text_area(
            "¿Cómo te sientes hoy?",
            height=180,
            placeholder="Escribe sobre tu día...",
            key="entry_text"
        )

        col1, col2 = st.columns([1, 3])
        with col1:
            submitted = st.button("💾 Guardar", type="primary", use_container_width=True)
        with col2:
            preview = st.button("🔍 Solo Analizar")

        if submitted or preview:
            ok, err = validate_entry(text_input)
            if not ok:
                st.error(err)
            else:
                with st.spinner("Analizando..."):
                    analysis = sa.analyze_entry(text_input)

                if submitted:
                    entry_id = db.save_entry(text_input, analysis)
                    st.success(f"✅ Entrada #{entry_id} guardada")

                render_analysis(analysis)

    elif section == "📖 Mi Historial":
        st.title("📖 Mi Historial")
        
        entries = db.get_all_entries(limit=100)
        if not entries:
            st.info("No hay entradas aún.")
            return

        # Filtros
        col1, col2 = st.columns(2)
        with col1:
            mood_filter = st.multiselect("Filtrar:", MOOD_ORDER, default=MOOD_ORDER)
        with col2:
            search = st.text_input("🔍 Buscar:", "")

        filtered = [e for e in entries if e.get('mood_label') in mood_filter 
                   and (not search or search.lower() in e['text'].lower())]
        
        st.caption(f"Mostrando {len(filtered)} de {len(entries)}")
        for entry in filtered:
            render_entry_card(entry)

    else:
        st.title("📊 Mis Estadísticas")
        
        entries = db.get_all_entries(limit=500)
        if len(entries) < 2:
            st.info("Necesitas al menos 2 entradas.")
            return

        stats = stats_module.compute_all_stats(entries)
        render_statistics(stats, entries)


if __name__ == "__main__":
    main()
