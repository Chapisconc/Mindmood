import re

class CTextCleaner:
    @staticmethod
    def fnCleanAndStandardize(strText: str) -> str:
        """Limpieza inicial de emojis de texto, normalización de espacios."""
        strText = strText.strip()
        # Transformar emoticones comunes textuales
        dictAbrev = {
            r':\)': ' feliz ',
            r':\(': ' triste ',
            r':D': ' muy alegre ',
            r'xD': ' divertido '
        }
        for regexPattern, strWord in dictAbrev.items():
            strText = re.sub(regexPattern, strWord, strText, flags=re.IGNORECASE)
            
        # Remover múltiples espacios
        strText = re.sub(r'\s+', ' ', strText)
        return strText.strip()

    @staticmethod
    def fnSplitSentences(strText: str) -> list[str]:
        """Divide el texto en oraciones lógicas."""
        # Split por '.', '!', '?', '\n' y conectores clave
        strRegex = r'(?<=[.!?\n])\s+|(?=\by\b)|(?=\bpero\b)'
        lstParts = re.split(strRegex, strText)
        lstClean = [p.strip() for p in lstParts if len(p.strip()) > 2]
        # Si la lista queda vacía (solo tenía puntuación, por ejemplo):
        if not lstClean and strText.strip():
            return [strText.strip()]
        return lstClean
