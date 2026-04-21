# REFACTOR PLAN - Diario Inteligente

**Paso 1: Backup** - ✅ manifest.txt creado

**Paso 2: Nueva estructura carpetas**
```
diario_inteligente/
├── src/
│   ├── application/     # UI Streamlit vMain()
│   │   └── app.py
│   ├── ecu_abstraction/ # Lógica negocio vAnalyzeEntry, vComputeStats
│   │   ├── sentiment_analysis.py
│   │   └── statistics.py
│   └── mcal/           # Drivers BD, config
│       ├── database.py
│       └── config.py
├── tests/
│   ├── unit/
│   └── integration/
├── config/
│   └── settings.yaml
├── logs/
├── data/
├── requirements.txt
├── .gitignore
└── README.md
```

