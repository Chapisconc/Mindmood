import pandas as pd
import numpy as np

class StatisticsService:
    """Cálculos y agregaciones de métricas del diario."""
    
    def compute_all_stats(self, entries: list[dict]) -> dict:
        if not entries:
            return self._empty_stats()
            
        df = pd.DataFrame(entries)
        if "compound_mean" not in df.columns:
            return self._empty_stats()
            
        # Clean formatting for dates
        df['datetime'] = pd.to_datetime(df['created_at'])
        df['date'] = df['datetime'].dt.date
        
        mood_dist = df['mood_label'].value_counts().to_dict() if 'mood_label' in df.columns else {}
        
        # Temporal grouping for charts
        daily_mean = df.groupby('date')['compound_mean'].mean().reset_index()
        daily_mean = daily_mean.sort_values('date')
        
        return {
            "total_entries": len(entries),
            "mood_distribution": mood_dist,
            "temporal_evolution": daily_mean,
            "raw_df": df
        }
    
    def _empty_stats(self) -> dict:
        return {
            "total_entries": 0,
            "mood_distribution": {},
            "temporal_evolution": pd.DataFrame(),
            "raw_df": pd.DataFrame()
        }

statistics_service = StatisticsService()
