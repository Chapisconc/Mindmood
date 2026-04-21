import streamlit as st
from infrastructure.database.repository import fnGetAllEntries
from app.services.statistics_service import statistics_service
from app.services.insight_service import insight_service
import plotly.express as px

def render():
    st.title("🏠 Dashboard Personal")
    st.markdown("Bienvenido a tu **Diario Inteligente**. Aquí tienes un resumen de tu actividad reciente.")
    
    entries = fnGetAllEntries(100)
    stats = statistics_service.compute_all_stats(entries)
    
    if stats["total_entries"] == 0:
        st.info("No hay entradas. Por favor, escribe tu primera entrada para ver tu dashboard.")
        return
        
    insights = insight_service.generate_insights(stats)
    
    st.markdown("### 💡 Insights Automáticos")
    for ins in insights:
        st.success(ins) if "!" in ins or "mejor" in ins else st.info(ins)
        
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Entradas", stats["total_entries"])
    
    df_evo = stats["temporal_evolution"]
    if not df_evo.empty:
        trend = "Estable"
        if len(df_evo) > 1:
            diff = df_evo.iloc[-1]['compound_mean'] - df_evo.iloc[0]['compound_mean']
            trend = "Subiendo 📈" if diff > 0 else "Bajando 📉"
        col2.metric("Tendencia Emocional", trend)
        
        dominant = max(stats["mood_distribution"], key=stats["mood_distribution"].get) if stats["mood_distribution"] else "N/A"
        col3.metric("Emoción Dominante", dominant)
        
        st.markdown("### 📈 Evolución Semanal")
        # Ensure we just plot recent ones
        fig = px.line(
            df_evo.tail(15), x="date", y="compound_mean", 
            markers=True, title="Score de Ánimo (-1 a 1)",
            labels={"date": "Fecha", "compound_mean": "Score"}
        )
        fig.update_traces(line_color="#4F46E5", marker=dict(size=8))
        fig.update_layout(margin=dict(t=40, b=20, l=20, r=20))
        st.plotly_chart(fig, use_container_width=True)
