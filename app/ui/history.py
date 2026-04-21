import streamlit as st
import pandas as pd
from datetime import datetime
from infrastructure.database.repository import fnGetAllEntries, fnDeleteEntry
from config.settings import MOOD_COLORS, MOOD_EMOJIS

def export_csv(entries: list):
    df = pd.DataFrame(entries)
    return df.to_csv(index=False).encode('utf-8')

def render():
    st.title("📖 Historial de Entradas")
    
    entries = fnGetAllEntries(500)
    if not entries:
        st.info("Aún no tienes entradas. ¡Escribe algunas para ver tu historial!")
        return
        
    st.markdown("### 🔍 Filtros")
    col1, col2 = st.columns(2)
    with col1:
        mood_filter = st.multiselect("Filtrar por Etiqueta", list(MOOD_COLORS.keys()), default=list(MOOD_COLORS.keys()))
    with col2:
        date_filter = st.date_input("Filtrar desde la fecha", value=None)
        
    # Apply filters
    filtered_entries = [e for e in entries if e.get('mood_label') in mood_filter]
    if date_filter:
        filtered_entries = [e for e in filtered_entries if datetime.strptime(e['entry_date'], "%Y-%m-%d").date() >= date_filter]
        
    st.caption(f"Mostrando {len(filtered_entries)} entradas.")
    
    if filtered_entries:
        st.download_button("⬇️ Exportar CSV", export_csv(filtered_entries), "historial_diario.csv", "text/csv")
    
    st.markdown("---")
    
    for entry in filtered_entries:
        label = entry.get('mood_label', 'Neutro')
        color = MOOD_COLORS.get(label, '#999')
        emoji = MOOD_EMOJIS.get(label, '📜')
        date_str = entry.get('created_at', '')
        text = entry.get('text', '')
        
        st.markdown(f"""
        <div class="glass-card" style="border-left: 4px solid {color};">
            <div style="display: flex; justify-content: space-between;">
                <strong>{emoji} {label}</strong>
                <small style="color: gray;">{date_str}</small>
            </div>
            <p style="margin-top: 10px; font-size: 15px;">{text[:300]}{'...' if len(text)>300 else ''}</p>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("Opciones de Entrada"):
            st.write(text)
            if st.button("🗑️ Eliminar Entrada", key=f"del_{entry['id']}", type="secondary"):
                fnDeleteEntry(entry['id'])
                st.rerun()
