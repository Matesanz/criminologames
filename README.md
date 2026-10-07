# criminologames

Un libro que enseña criminología mediante casos de lógica. Vive primero como web y de ella saldrán ediciones impresas.

- Vocabulario del proyecto: [`GLOSSARY.md`](GLOSSARY.md)
- Decisiones: [`docs/adr/`](docs/adr/)

## Escribir un caso

Cada caso es un archivo Markdown en `contenido/casos/`. Ver [`contenido/casos/ejemplo.md`](contenido/casos/ejemplo.md).

La **cabecera** (entre líneas `---`) lleva los datos:

```yaml
id: el-identificador-del-caso
titulo: Título del caso
concepto: Concepto que enseña
pregunta: ¿Lo que el lector tiene que averiguar?
opciones:
  - id: una-opcion
    texto: Texto de la opción
    correcta: true        # exactamente una opción correcta
  - id: otra-opcion
    texto: Texto de otra opción
```

El **cuerpo** se divide en secciones con encabezados de primer nivel (`#`); dentro de cada una se puede usar Markdown libremente (`##`, negritas, citas…):

- `# Lección`
- `# Solución comentada` (la de la opción correcta)
- `# Error comentado: <id>`, una por cada opción incorrecta

Si un caso está incompleto o es incoherente, las pruebas y la construcción de la web fallan y dicen qué falta y dónde.

## Desarrollo

Requiere Node 22.

```sh
npm install
npm run dev      # web en local: http://localhost:4321/criminologames/
npm test         # pruebas del cargador de casos
npm run check    # comprobación de tipos
npm run build    # construye la web en dist/
```

Al fusionar en `main`, la web se publica sola en GitHub Pages (Settings → Pages → Source: GitHub Actions).
