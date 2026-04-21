import streamlit as st
import random
from app.services.sentiment_service import sentiment_service
from infrastructure.database.repository import fnSaveEntry
from config.settings import MOOD_COLORS, MOOD_EMOJIS

GUIAS = [
    "🧠 Profundiza: Identifica una emoción fuerte que sentiste hoy. ¿Qué crees que la desencadenó en el fondo?",
    "🌱 Autoconocimiento: Describe un momento del día en el que reaccionaste por instinto. ¿Fue útil o perjudicial?",
    "🌟 Gratitud: Nombra un pequeño detalle que hoy te sacó una sonrisa. ¿Por qué significó tanto?",
    "🛡️ Dificultades: ¿Qué fue lo más frustrante de hoy y cómo lo manejaste internamente?",
    "🚀 Propósito: ¿Sentiste que tus acciones de hoy te acercaron a la versión de ti mismo que quieres ser?"
]

def render():
    st.title("✍️ Escritura Terapéutica")
    
    st.markdown("### 🧭 Guía de Introspección")
    st.markdown("Responder a estas preguntas puede ayudarte a estructurar tus pensamientos y a que el algoritmo capture mejor tus emociones subyacentes.")
    
    if 'prompt' not in st.session_state:
        st.session_state['prompt'] = random.choice(GUIAS)
        
    st.info(f"Sugerencia: {st.session_state['prompt']}")
    if st.button("🔄 Cambiar pregunta"):
        st.session_state['prompt'] = random.choice(GUIAS)
        st.rerun()
        
    text = st.text_area("Vuelca tus pensamientos aquí...", height=250, placeholder="Hoy me pasó que...")
    
    col1, col2 = st.columns(2)
    saved = col1.button("💾 Guardar Entrada de Diario", type="primary", use_container_width=True)
    analyzed = col2.button("🔍 Ver Análisis en Pantalla", use_container_width=True)
    
    if saved or analyzed:
        if len(text.strip()) < 10:
            st.error("Por favor profundiza un poco más. La IA necesita algo de contexto para analizar tu día.")
            return
            
        with st.spinner("Decodificando tus emociones internamente..."):
            result = sentiment_service.analyze_text(text)
            
        if saved:
            nId = fnSaveEntry(text, result)
            st.success("¡Tu reflexión se ha guardado de forma segura!")
            
        render_analysis(result)

def render_analysis(result: dict):
    st.markdown("---")
    res_label = result.get("mood_label", "Neutro")
    emoji = MOOD_EMOJIS.get(res_label, "😐")
    color = MOOD_COLORS.get(res_label, "#888")
    
    st.markdown(f"""
    <div class="glass-card" style="border-left: 6px solid {color}; padding: 2rem;">
        <div style="text-align: center;">
            <h1 style="font-size: 5rem; margin: 0;">{emoji}</h1>
            <h2 style="color: {color}; margin: 10px 0;">{res_label}</h2>
            <p style="font-size: 1.1rem; color: gray;">El algoritmo indica que tu bienestar en este momento tiende a ser <b>{res_label.lower()}</b>.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Intuitive display of stats
    st.markdown("### 🧩 Desglose Intuitivo de tu Texto")
    c1, c2 = st.columns(2)
    
    pos = result.get('pos_ratio', 0)
    neg = result.get('neg_ratio', 0)
    
    with c1:
        st.markdown("**Carga Positiva Detectada**")
        st.progress(min(pos, 1.0))
        st.caption(f"El {pos*100:.0f}% de tus palabras transmitieron optimismo o tranquilidad.")
        
    with c2:
        st.markdown("**Carga Negativa Detectada**")
        st.progress(min(neg, 1.0))
        st.caption(f"El {neg*100:.0f}% de tus palabras mostraron frustración, molestia o tristeza.")
        
    if result.get('contradictory', False):
        st.warning("⚠️ **Choque Emocional:** Tienes sentimientos muy encontrados en esta entrada. Mencionas cosas muy buenas y cosas muy malas a la vez.")
