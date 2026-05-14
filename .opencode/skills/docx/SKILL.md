---
name: docx_manipulation
description: Use esta habilidad siempre que el usuario desee crear, leer, editar o manipular documentos de Word (.docx) con formato profesional, graficos, diagramas UML, TOC automatico y marcas de agua.
---

# Habilidad de Manipulación de Documentos Word (.docx)

## Propósito
Crear documentos .docx con calidad profesional usando python-docx + matplotlib, incluyendo graficos nativos de Word, diagramas UML personalizados, tablas de contenido automaticas, marcas de agua, estilos corporativos y mas.

## Librerias Requeridas
```bash
pip install python-docx matplotlib
```
Opcional para diagramas de flujo: `pip install graphviz`

## Tecnicas Avanzadas

### 1. Graficos Nativos de Word
Usa `docx.chart.data.CategoryChartData` para crear graficos editables directamente en Word.

```python
from docx.chart.data import CategoryChartData
from docx.enum.chart import XL_CHART_TYPE

chart_data = CategoryChartData()
chart_data.categories = ['Ene', 'Feb', 'Mar']
chart_data.add_series('Serie 1', [100, 200, 150])
chart = doc.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, width=Cm(16), height=Cm(9), chart_data=chart_data)
```
Tipos disponibles: `COLUMN_CLUSTERED` (barras), `PIE` (pastel), `LINE_MARKERS` (lineas), `BAR_CLUSTERED` (barras horizontales).

### 2. Diagramas con Matplotlib
Usa matplotlib para diagramas personalizados y conviertelos a PNG para insertarlos.

```python
import matplotlib.pyplot as plt
import io

fig, ax = plt.subplots(figsize=(8, 4.5))
ax.bar(categorias, valores, color='#6366F1')
ax.set_title('Titulo', fontweight='bold')
buf = io.BytesIO()
fig.savefig(buf, format='png', dpi=200, bbox_inches='tight')
buf.seek(0)
doc.add_picture(buf, width=Cm(16))
plt.close(fig)
```

### 3. Diagramas UML (Clases, Secuencia, Casos de Uso, Estados)
Usa matplotlib con `FancyBboxPatch` para cajas y `annotate` para flechas.

**Diagrama de Clases**: Cajas con nombre, atributos y metodos (monospace). Flechas de herencia y asociacion.
**Diagrama de Secuencia**: Lineas de vida verticales, flechas horizontales con mensajes entre actores.
**Diagrama de Casos de Uso**: Figuras de palo (actores) a la izquierda, elipses (casos) a la derecha, lineas de conexion.
**Diagrama de Estados**: Estados en cajas redondeadas dispuestas en circulo, flechas curvas con eventos.

### 4. Tabla de Contenido Automatica (TOC)
Usa campos XML de Word para insertar un TOC que se actualiza al abrir el documento.

```python
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

run = paragraph.add_run()
fldChar = OxmlElement('w:fldChar')
fldChar.set(qn('w:fldCharType'), 'begin')
run._r.append(fldChar)
instrText = OxmlElement('w:instrText')
instrText.set(qn('xml:space'), 'preserve')
instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
run._r.append(instrText)
# ... separate, end
```
Requiere usar `doc.add_heading('...', level=1/2/3)` en lugar de texto plano.

### 5. Marcas de Agua
Inserta texto en el header de la primera seccion con tamanio grande y color semitransparente.

```python
header = doc.sections[0].header
run = header.add_paragraph().add_run('CONFIDENCIAL')
run.font.size = Pt(60)
run.font.color.rgb = RGBColor(0xD9, 0xD9, 0xD9)
```

### 6. Secciones Horizontal/Vertical
Para tablas o graficos anchos, crear seccion landscape.

```python
from docx.enum.section import WD_ORIENT
section = doc.add_section()
section.orientation = WD_ORIENT.LANDSCAPE
```

### 7. Estilos Personalizados
Modificar Heading 1/2/3 para coherencia visual.

```python
h1 = doc.styles['Heading 1']
h1.font.size = Pt(20)
h1.font.color.rgb = RGBColor(99, 102, 241)
```

### 8. Tablas con Formato
Tablas con cabecera de color, filas alternadas y texto centrado, usando XML para sombreado.

### 9. Pie de Pagina con Numeracion
Campo `PAGE` via XML para numeracion automatica.

## Flujo de Trabajo Recomendado

1. Configurar estilos de titulos (`configurar_estilos_titulos(doc)`)
2. Agregar portada
3. Insertar TOC (`insertar_indice_automatico(doc)`)
4. Configurar pie de pagina (`configurar_pie_pagina(doc)`)
5. Escribir secciones usando `doc.add_heading(texto, level=1/2/3)`
6. Insertar graficos/diagramas via matplotlib o nativos
7. Insertar tablas con `add_tabla(doc, headers, rows)`
8. Guardar documento

## Notas
- Usar `Cm()` o `Inches()` para dimensiones. 1 inch = 2.54 cm.
- Los campos TOC y PAGE se actualizan al abrir el documento en Word.
- Para diagramas: las figuras matplotlib deben cerrarse con `plt.close(fig)` para liberar memoria.
- Preferir matplotlib sobre graficos nativos de Word cuando se necesita control visual total (colores, anotaciones, multi-series).
