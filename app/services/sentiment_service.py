from infrastructure.ml.sentiment_pipeline import CSentimentPipeline

class SentimentService:
    """Servicio que coordina el análisis de sentimientos."""
    
    _instance = None
    _pipeline = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._pipeline = CSentimentPipeline()
        return cls._instance

    def analyze_text(self, text: str) -> dict:
        """
        Analiza un texto de diario.
        Retorna la estructura de datos requerida.
        """
        if not text or len(text.strip()) < 3:
            return {
                "sLabel": "Neutro",
                "fScore": 0.0,
                "fStd": 0.0,
                "u32Sentences": 0,
                "compound_mean": 0.0
            }
        
        return self._pipeline.fnAnalyze(text)

sentiment_service = SentimentService()
