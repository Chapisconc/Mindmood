import os

project_dir = r"c:\Users\PC\.gemini\antigravity\scratch\diario_inteligente"
output_file = os.path.join(project_dir, "codigo_completo_reporte.txt")

dirs_to_exclude = ['venv', '.venv', '__pycache__', '.git', '.pytest_cache', 'backup_original', 'backup_v2', '.gemini', 'data', 'logs']

with open(output_file, 'w', encoding='utf-8') as out_f:
    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in dirs_to_exclude and not d.startswith('.')]
        
        for file in files:
            if file.endswith('.py') or file.endswith('.txt') or file.endswith('.md'):
                # Avoid self, sqlite DB, previous text dumps
                if file in ['generar_reporte.py', 'capture_streamlit.py', 'codigo_completo_para_ia.txt', 'codigo_completo_reporte.txt', 'archivos_para_otra_ia.txt', 'análisis_proyecto.txt']:
                    continue
                    
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, project_dir)
                
                out_f.write(f"\n{'='*80}\n")
                out_f.write(f"Archivo: {rel_path}\n")
                out_f.write(f"{'='*80}\n\n")
                try:
                    with open(filepath, 'r', encoding='utf-8') as in_f:
                        out_f.write(in_f.read())
                except Exception as e:
                    out_f.write(f"Error reading {rel_path}: {e}\n")

print("Reporte generado con éxito en codigo_completo_reporte.txt")
