import streamlit as st
from app.ui import dashboard, entry_form, history, analytics
from infrastructure.database.repository import fnInitDb, fnGenerateSyntheticData
from config.settings import APP_NAME, APP_VERSION

def inject_global_css():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        /* Aplicamos la tipografia a nivel raíz, Streamlit protegerá automáticamente sus iconos si no forzamos etiquetas universales */
        .stApp {
            font-family: 'Inter', sans-serif;
        }
        
        /* Ocultar elementos no deseados nativos de Streamlit */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        
        /* Tarjetas con esquinas redondeadas y sombras */
        .glass-card {
            background: var(--background-color);
            border-radius: 1.25rem;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(128, 128, 128, 0.1);
            margin-bottom: 1rem;
        }
        
        /* Botones redondeados */
        div.stButton > button {
            border-radius: 0.75rem !important;
            font-weight: 600 !important;
            padding: 0.5rem 1.25rem !important;
        }
        </style>
    """, unsafe_allow_html=True)

def run():
    st.set_page_config(
        page_title=APP_NAME,
        page_icon="📔",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    inject_global_css()
    fnInitDb()
    
    st.sidebar.title(f"📔 {APP_NAME}")
    st.sidebar.caption(f"v{APP_VERSION} - NLP Ligero")
    st.sidebar.markdown("---")
    
    page = st.sidebar.radio(
        "Navegación",
        ["🏠 Dashboard", "✍️ Nueva Entrada", "📖 Historial", "📊 Estadísticas"]
    )
    
    st.sidebar.markdown("---")
    if st.sidebar.button("🎲 Datos de Prueba", use_container_width=True):
        with st.spinner("Generando..."):
            fnGenerateSyntheticData(10)
        st.rerun()

    if page == "🏠 Dashboard":
        dashboard.render()
    elif page == "✍️ Nueva Entrada":
        entry_form.render()
    elif page == "📖 Historial":
        history.render()
    elif page == "📊 Estadísticas":
        analytics.render()
