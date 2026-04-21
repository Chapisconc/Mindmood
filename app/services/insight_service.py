import pandas as pd
import numpy as np

class InsightService:
    """Genera conclusiones 'Insights' en lenguaje natural basados en los datos."""
    
    def generate_insights(self, stats: dict) -> list[str]:
        insights = []
        df = stats.get("raw_df", pd.DataFrame())
        
        if df.empty or len(df) < 3:
            return ["No hay suficientes datos para generar insights profundos aún. ¡Sigue escribiendo!"]
            
        # 1. Análisis de tendencia reciente (últimos 7 días)
        latest_date = df['date'].max()
        week_ago = latest_date - pd.Timedelta(days=7)
        recent_df = df[df['date'] >= week_ago]
        past_df = df[df['date'] < week_ago]
        
        if not recent_df.empty and not past_df.empty:
            recent_mean = recent_df['compound_mean'].mean()
            past_mean = past_df['compound_mean'].mean()
            diff = recent_mean - past_mean
            
            if diff > 0.3:
                insights.append("🌟 **¡Tu estado ha mejorado sorprendentemente esta semana!** Vas por un gran camino.")
            elif diff > 0.1:
                insights.append("📈 Muestras una leve mejoría emocional en comparación con semanas anteriores.")
            elif diff < -0.3:
                insights.append("🌧️ Últimamente estás más negativo. Recuerda ser compasivo contigo mismo.")
            elif diff < -0.1:
                insights.append("📉 Tu ánimo ha decaído levemente estos últimos 7 días. Tómate un respiro si lo necesitas.")
            else:
                insights.append("⚖️ Tu estado de ánimo se ha mantenido muy estable recientemente.")
        
        # 2. Análisis de variabilidad (Desviación estándar global)
        std_dev = df['compound_mean'].std()
        if not pd.isna(std_dev):
            if std_dev > 0.5:
                insights.append("🎢 Tienes **alta variabilidad emocional**. Tus días oscilan fuertemente entre positivos y negativos.")
            elif std_dev < 0.2:
                insights.append("🧘 Posees una gran **estabilidad emocional**. Tus reflexiones son consistentes.")
        
        # 3. Datos extremos
        if 'mood_label' in df.columns:
            counts = df['mood_label'].value_counts()
            total = len(df)
            if 'Muy positivo' in counts and counts['Muy positivo'] / total > 0.4:
                insights.append("🔥 ¡Eres una persona muy optimista! Más del 40% de tus entradas son súper positivas.")
            if 'Muy negativo' in counts and counts['Muy negativo'] / total > 0.3:
                insights.append("❤️‍🩹 Una parte significativa de tus días son duros. La escritura terapéutica es un excelente paso.")
                
        if not insights:
            insights.append("📝 Mantienes un hábito de escritura constante, lo cual es excelente para tu salud mental.")
            
        return insights

insight_service = InsightService()
