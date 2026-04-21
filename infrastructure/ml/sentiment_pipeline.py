from deep_translator import GoogleTranslator
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from infrastructure.ml.text_cleaner import CTextCleaner
import statistics
import re

class CSentimentPipeline:
    def __init__(self):
        self.objAnalyzer = SentimentIntensityAnalyzer()
        self.objTranslator = GoogleTranslator(source='es', target='en')
        
        # Mapeo de modismos o frases complejas en español que el traductor pierde
        self.dictIdioms = {
            r'\bhecho polvo\b': -0.6,
            r'\bme lleva el diablo\b': -0.7,
            r'\bde maravilla\b': 0.6,
            r'\bde lujo\b': 0.6,
            r'\bhecho pedazos\b': -0.7,
            r'\btocando fondo\b': -0.8,
            r'\ben las nubes\b': 0.7,
            r'\bpor los suelos\b': -0.7,
            r'\bni fu ni fa\b': 0.0,
            r'\bvale la pena\b': 0.5,
            r'\bme da igual\b': -0.1,
            r'\ba flor de piel\b': 0.2 # Intensifica la emoción previa, pero por base da empuje
        }
        
    def _fnExtractTags(self, strText: str) -> list[str]:
        """Categoriza el texto en etiquetas psicológicas útiles usando expresiones regulares."""
        strLow = strText.lower()
        setTags = set()
        if re.search(r'\b(ansiedad|nervioso|preocupado|angustia|miedo|pánico|estrés|estresado)\b', strLow): setTags.add("Ansiedad / Estrés")
        if re.search(r'\b(triste|llorar|deprimido|solo|vacio|apagado|desolado|nostalgia)\b', strLow): setTags.add("Tristeza / Melancolía")
        if re.search(r'\b(feliz|alegre|emocionado|motivado|increible|paz|calma|genial|espectacular)\b', strLow): setTags.add("Bienestar / Euforia")
        if re.search(r'\b(enojo|rabia|molesto|harto|cansado|odio|coraje|ira|furia)\b', strLow): setTags.add("Frustración / Ira")
        if re.search(r'\b(duda|confundido|perdido|indeciso|no se que hacer|bloqueado)\b', strLow): setTags.add("Confusión / Duda")
        return list(setTags)

    def fnAnalyze(self, strTextRaw: str) -> dict:
        """Pipeline hiper-optimizado de análisis de sentimiento."""
        # 1. Clean
        strTextClean = CTextCleaner.fnCleanAndStandardize(strTextRaw)
        
        # Heurísticas de texto original
        nExclamations = strTextRaw.count('!')
        nAllCapsWords = sum(1 for w in strTextRaw.split() if w.isupper() and len(w) > 2)
        fIntensityMod = 1.0 + (nExclamations * 0.05) + (nAllCapsWords * 0.03)
        fIntensityMod = min(fIntensityMod, 1.5) # Cap max 50% de bonus por signos y mayúsculas
        
        # 2. Split sentences
        lstSentencesEs = CTextCleaner.fnSplitSentences(strTextClean)
        if not lstSentencesEs:
            lstSentencesEs = [strTextRaw]
            
        lstSentencesData = []
        lstCompounds = []
        fMaxPos = 0.0
        fMaxNeg = 0.0
        nNegations = 0
        nIntensifiers = 0
        
        lstNegWords = ['no', 'nunca', 'jamas', 'tampoco', 'nadie', 'nada']
        lstIntensWords = ['muy', 'super', 'súper', 'demasiado', 'totalmente', 'increiblemente', 'extremadamente', 'absolutamente', 'bastante']
        
        # 3. Inferencia y Cálculo Avanzado
        for strSentenceEs in lstSentencesEs:
            strLower = strSentenceEs.lower()
            
            # Conteo de features nativos
            for w in strLower.split():
                if w in lstNegWords: nNegations += 1
                if w in lstIntensWords: nIntensifiers += 1

            # Identificación de modismos para pre-calcular bonus
            fIdiomScore = 0.0
            for regexStr, score in self.dictIdioms.items():
                if re.search(regexStr, strLower):
                    fIdiomScore += score

            try:
                # Traducción puente para VADER
                strSentenceEn = self.objTranslator.translate(strSentenceEs)
                dictScores = self.objAnalyzer.polarity_scores(strSentenceEn)
            except Exception as e:
                # Fallback seguro
                dictScores = {"compound": 0, "pos": 0, "neg": 0, "neu": 1}
                strSentenceEn = ""
                
            # Cálculo final del compound aplicando los bonus
            fC = dictScores['compound']
            
            # Si el compound de VADER y el idiom tienen el mismo signo, lo empuja. Si no, lo corrige.
            fC = fC + fIdiomScore
            
            # Aplicar heurística estructural (mayúsculas y signos)
            if fC > 0: fC = min(1.0, fC * fIntensityMod)
            elif fC < 0: fC = max(-1.0, fC * fIntensityMod)
            
            lstCompounds.append(fC)
            fMaxPos = max(fMaxPos, dictScores['pos'])
            fMaxNeg = max(fMaxNeg, dictScores['neg'])
            
            lstSentencesData.append({
                "text": strSentenceEs,
                "compound": fC
            })
            
        # 4. Agregación y Detección de Volatilidad
        fMeanCompound = statistics.mean(lstCompounds) if lstCompounds else 0.0
        fStdCompound = statistics.stdev(lstCompounds) if len(lstCompounds) > 1 else 0.0
        
        # Volatilidad intradía / Contradicción severa
        nAbruptChanges = 0
        bContradictory = False
        if len(lstCompounds) >= 2:
            for i in range(1, len(lstCompounds)):
                diff = abs(lstCompounds[i] - lstCompounds[i-1])
                if diff > 0.8: # Ej: De positivo fuerte a negativo fuerte inmediatamente
                    nAbruptChanges += 1
            if fMaxPos > 0.3 and fMaxNeg > 0.3 and nAbruptChanges > 0:
                bContradictory = True
        
        # Extraer Etiquetas Psicológicas
        lstTags = self._fnExtractTags(strTextRaw)
        
        # Asignación Intuitiva de Etiqueta (Threshold mapping)
        from config.settings import MOOD_THRESHOLDS
        strLabel = "Neutro"
        if fMeanCompound >= MOOD_THRESHOLDS["Muy positivo"]: strLabel = "Muy positivo"
        elif fMeanCompound >= MOOD_THRESHOLDS["Positivo"]: strLabel = "Positivo"
        elif fMeanCompound <= MOOD_THRESHOLDS["Muy negativo"]: strLabel = "Muy negativo"
        elif fMeanCompound <= MOOD_THRESHOLDS["Negativo"]: strLabel = "Negativo"
            
        return {
            "compound_mean": fMeanCompound,
            "compound_std": fStdCompound,
            "pos_ratio": fMaxPos,
            "neg_ratio": fMaxNeg,
            "neu_ratio": max(0, 1 - (fMaxPos + fMaxNeg)),
            "intensity_max": max(fMaxPos, fMaxNeg),
            "mood_score": fMeanCompound,
            "mood_label": strLabel,
            "emotional_var": fStdCompound,
            "contradictory": bContradictory,
            "abrupt_changes": nAbruptChanges,
            "sentences": lstSentencesData,
            "sLabel": strLabel, 
            "fScore": fMeanCompound,
            "u32Sentences": len(lstSentencesEs),
            "tags": lstTags,
            "stats": {
                "negations": nNegations,
                "intensifiers": nIntensifiers,
                "all_caps": nAllCapsWords,
                "exclamations": nExclamations
            }
        }
