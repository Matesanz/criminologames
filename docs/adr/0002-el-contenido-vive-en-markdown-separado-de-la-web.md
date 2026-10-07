# El contenido vive en Markdown, separado de la web

Cada caso (con su lección, escena, detalles, pregunta, opciones, solución comentada, errores comentados y fuentes) se escribe como un archivo Markdown, y la versión web se genera a partir de él. Así el mismo origen servirá para producir ediciones impresas sin reescribir nada, el autor puede corregir el texto sin tocar código, y la revisión del rigor criminológico se hace en PRs sobre texto legible.

## Considered Options

- **Contenido dentro del código de la web** (componentes con el texto incrustado): más rápido para un primer caso, pero ata el contenido a la web y obliga a reescribirlo para imprimir.
- **Editor visual o base de datos**: demasiado trabajo para validar un solo caso y aleja la revisión de los PRs.
