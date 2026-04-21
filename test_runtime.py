from src.mcal.db_repository import fnGenerateSyntheticData, fnGetAllEntries
from src.application.app import fnExportToCsv
import json

try:
    print("Generating synthetic data...")
    fnGenerateSyntheticData(2)
    print("Getting entries...")
    entries = fnGetAllEntries(5)
    print("Found entries:", len(entries))
    csv_bytes = fnExportToCsv(entries)
    print("CSV bytes len:", len(csv_bytes))
    print("All good!")
except Exception as e:
    import traceback
    traceback.print_exc()
