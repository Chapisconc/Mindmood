import streamlit as st
import pandas as pd
import plotly.express as px
from infrastructure.database.repository import fnGetAllEntries
from app.services.statistics_service import statistics_service
from config.settings import MOOD_COLORS

def render():
    st.title("📊 Análisis de Patrones de Ánimo")
    
    entries = fnGetAllEntries(500)
    stats = statistics_service.compute_all_stats(entries)
    
    if stats["total_entries"] < 3:
        st.warning("Necesitamos al menos 3 entradas en diferentes días para empezar a graficar tus patrones eficientemente.")
        return
        
    df = stats["raw_df"]
    
    st.markdown("### 🍩 Proporción Global de Emociones")
    st.write("Mira rápidamente qué tipo de días predominan en tu vida últimamente.")
    mood_dist = stats["mood_distribution"]
    if mood_dist:
        df_mood = pd.DataFrame(list(mood_dist.items()), columns=['Estado', 'Días contabilizados'])
        fig_pie = px.pie(df_mood, names='Estado', values='Días contabilizados', hole=0.6, 
                         color='Estado', color_discrete_map=MOOD_COLORS)
        fig_pie.update_traces(textinfo='percent+label', textfont_size=14)
        fig_pie.update_layout(showlegend=False, margin=dict(t=0, b=0, l=0, r=0))
        st.plotly_chart(fig_pie, use_container_width=True)
        
    st.markdown("---")
    
    st.markdown("### 📅 Calendario de Intensidad Emocional")
    st.write("Esta gráfica de barras fácil de entender te muestra qué tan alto (positivo) o bajo (negativo) estuvo tu ánimo cada día registrado.")
    
    if not df.empty and 'date' in df.columns:
        daily = df.groupby('date')['compound_mean'].mean().reset_index()
        # Create a dynamic color column based on polarity
        daily['Tipo de Día'] = daily['compound_mean'].apply(lambda x: "Día Positivo" if x > 0 else ("Día Negativo" if x < 0 else "Neutro"))
        color_map = {"Día Positivo": MOOD_COLORS["Positivo"], "Día Negativo": MOOD_COLORS["Negativo"], "Neutro": MOOD_COLORS["Neutro"]}
        
        fig_bar = px.bar(
            daily, x="date", y="compound_mean", color="Tipo de Día",
            color_discrete_map=color_map,
            labels={"date": "Fecha exacta", "compound_mean": "Puntaje Promedio"}
        )
        fig_bar.update_layout(
            yaxis=dict(title="⬅ Negativo | Positivo ➡", tickvals=[-1, -0.5, 0, 0.5, 1], ticktext=["Catástrofe", "Malo", "Normal", "Bueno", "Excelente"]),
            xaxis=dict(title=""),
            bargap=0.2, margin=dict(t=20, b=0, l=0, r=0)
        )
        st.plotly_chart(fig_bar, use_container_width=True)
