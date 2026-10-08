import { describe, expect, test } from "vitest";
import { cargarCaso } from "./cargarCaso";

const casoValido = `---
id: el-portal
titulo: El portal
concepto: Fiabilidad del testimonio
pregunta: ¿Qué testigo es fiable?
opciones:
  - id: portera
    texto: La portera
    correcta: true
  - id: vecino
    texto: El vecino del quinto
escena:
  imagen: el-portal/escena.svg
  puntos:
    - detalle: farola
      etiqueta: La farola
      x: 20
      y: 35
    - detalle: declaracion-vecino
      etiqueta: Declaración del vecino
      x: 70.5
      y: 60
detalles:
  - id: farola
    titulo: La farola del portal
    tipo: ilustracion
    imagen: el-portal/farola.svg
  - id: declaracion-vecino
    titulo: Declaración del vecino
    tipo: documento
---

# Lección

La memoria no es una grabación.

# Detalle: declaracion-vecino

«Lo vi clarísimo desde mi ventana.»

# Solución comentada

La portera estaba cerca y con buena luz.

# Error comentado: vecino

El vecino estaba muy seguro, pero la seguridad no predice la exactitud.
`;

function sinLinea(markdown: string, linea: string): string {
  if (!markdown.includes(linea + "\n")) throw new Error(`No existe: ${linea}`);
  return markdown.replace(linea + "\n", "");
}

function errores(markdown: string): string[] {
  const resultado = cargarCaso(markdown);
  if (resultado.ok) throw new Error("Se esperaban errores y el caso cargó");
  return resultado.errores;
}

describe("cargarCaso", () => {
  test("un punto no tiene etiqueta", () => {
    const caso = sinLinea(casoValido, "      etiqueta: La farola");

    expect(errores(caso)).toContain(
      "Cabecera: al punto 1 de la escena le falta el campo obligatorio «etiqueta».",
    );
  });

  test("un detalle no tiene título", () => {
    const caso = sinLinea(casoValido, "    titulo: La farola del portal");

    expect(errores(caso)).toContain(
      "Cabecera: al detalle 1 le falta el campo obligatorio «titulo».",
    );
  });

  test("dos detalles comparten identificador", () => {
    const caso = casoValido.replace(
      "  - id: declaracion-vecino\n",
      "  - id: farola\n    titulo: Otra farola\n    tipo: ilustracion\n    imagen: otra.svg\n  - id: declaracion-vecino\n",
    );

    expect(errores(caso)).toContain(
      "Cabecera: el identificador de detalle «farola» está repetido.",
    );
  });

  test("sobra una sección de detalle que no corresponde a ningún detalle", () => {
    const caso = casoValido + "\n# Detalle: buzon\n\nNada.\n";

    expect(errores(caso)).toContain(
      "Cuerpo: la sección «# Detalle: buzon» no corresponde a ningún detalle.",
    );
  });

  test("un detalle tiene un tipo desconocido", () => {
    const caso = casoValido.replace("    tipo: documento\n", "    tipo: video\n");

    expect(errores(caso)).toContain(
      "Cabecera: el detalle «declaracion-vecino» tiene el tipo «video»; debe ser «ilustracion» o «documento».",
    );
  });

  test("un detalle ilustrado no tiene imagen", () => {
    const caso = sinLinea(casoValido, "    imagen: el-portal/farola.svg");

    expect(errores(caso)).toContain(
      "Cabecera: al detalle «farola» le falta el campo obligatorio «imagen».",
    );
  });

  test("un documento no tiene texto", () => {
    const caso = casoValido.replace(
      "# Detalle: declaracion-vecino\n\n«Lo vi clarísimo desde mi ventana.»\n\n",
      "",
    );

    expect(errores(caso)).toContain(
      "Cuerpo: el documento «declaracion-vecino» no tiene su sección «# Detalle: declaracion-vecino».",
    );
  });

  test("un punto abre un detalle que no existe", () => {
    const caso = casoValido.replace(
      "    - detalle: farola\n",
      "    - detalle: farol\n",
    );

    expect(errores(caso)).toContain(
      "Cabecera: el punto 1 de la escena abre el detalle «farol», que no existe.",
    );
  });

  test("un detalle no se puede alcanzar desde ningún punto", () => {
    const caso = casoValido.replace(
      "    - detalle: farola\n      etiqueta: La farola\n      x: 20\n      y: 35\n",
      "",
    );

    expect(errores(caso)).toContain(
      "Cabecera: ningún punto de la escena abre el detalle «farola».",
    );
  });

  test("la posición de un punto está fuera de la imagen", () => {
    const caso = casoValido.replace("      x: 70.5\n", "      x: 120\n");

    expect(errores(caso)).toContain(
      "Cabecera: el punto 2 de la escena tiene «x» fuera de la imagen (debe estar entre 0 y 100 y es 120).",
    );
  });

  test("la posición de un punto no es un número", () => {
    const caso = casoValido.replace("      y: 35\n", "      y: arriba\n");

    expect(errores(caso)).toContain(
      "Cabecera: el punto 1 de la escena tiene «y» fuera de la imagen (debe estar entre 0 y 100 y es arriba).",
    );
  });

  test("el caso no tiene escena", () => {
    const caso = casoValido.replace(/escena:[\s\S]*?(?=detalles:)/, "");

    expect(errores(caso)).toContain("Cabecera: falta la «escena».");
  });

  test("la escena no tiene imagen", () => {
    const caso = sinLinea(casoValido, "  imagen: el-portal/escena.svg");

    expect(errores(caso)).toContain(
      "Cabecera: a la escena le falta el campo obligatorio «imagen».",
    );
  });

  test("la escena no tiene puntos", () => {
    const caso = casoValido.replace(/  puntos:[\s\S]*?(?=detalles:)/, "");

    expect(errores(caso)).toContain(
      "Cabecera: la escena necesita al menos un punto que examinar.",
    );
  });

  test("el archivo no tiene cabecera", () => {
    expect(errores("# Lección\n\nHola.\n")).toEqual([
      "Cabecera: el archivo debe empezar con una cabecera entre líneas «---».",
    ]);
  });

  test("la cabecera no es YAML válido", () => {
    const caso = casoValido.replace("titulo: El portal", "titulo: [El portal");

    expect(errores(caso)[0]).toMatch(/^Cabecera: el YAML no es válido/);
  });

  test("informa de todos los fallos a la vez", () => {
    const caso = sinLinea(
      sinLinea(casoValido, "pregunta: ¿Qué testigo es fiable?"),
      "    correcta: true",
    );

    expect(errores(caso)).toEqual(
      expect.arrayContaining([
        "Cabecera: falta el campo obligatorio «pregunta».",
        "Cabecera: debe haber exactamente una opción correcta y hay 0.",
      ]),
    );
  });

  test("una opción no tiene texto", () => {
    const caso = sinLinea(casoValido, "    texto: El vecino del quinto");

    expect(errores(caso)).toContain(
      "Cabecera: a la opción 2 le falta el campo obligatorio «texto».",
    );
  });

  test("una opción no tiene identificador", () => {
    const caso = casoValido.replace(
      "  - id: vecino\n    texto:",
      "  - texto:",
    );

    expect(errores(caso)).toContain(
      "Cabecera: a la opción 2 le falta el campo obligatorio «id».",
    );
  });

  test("dos opciones comparten identificador", () => {
    const caso = casoValido.replace(
      "  - id: vecino\n",
      "  - id: portera\n    texto: La portera otra vez\n  - id: vecino\n",
    );

    expect(errores(caso)).toContain(
      "Cabecera: el identificador de opción «portera» está repetido.",
    );
  });

  test("sobra un error comentado de una opción que no existe", () => {
    const caso = casoValido + "\n# Error comentado: cartero\n\nNo estaba.\n";

    expect(errores(caso)).toContain(
      "Cuerpo: la sección «# Error comentado: cartero» no corresponde a ninguna opción incorrecta.",
    );
  });

  test("sobra un error comentado de la opción correcta", () => {
    const caso = casoValido + "\n# Error comentado: portera\n\nEra ella.\n";

    expect(errores(caso)).toContain(
      "Cuerpo: la sección «# Error comentado: portera» no corresponde a ninguna opción incorrecta.",
    );
  });

  test("una opción incorrecta no tiene error comentado", () => {
    const caso = casoValido.replace(/# Error comentado: vecino[\s\S]*$/, "");

    expect(errores(caso)).toContain(
      "Cuerpo: la opción incorrecta «vecino» no tiene su sección «# Error comentado: vecino».",
    );
  });

  test("falta la solución comentada", () => {
    const caso = casoValido.replace(
      "# Solución comentada\n\nLa portera estaba cerca y con buena luz.\n\n",
      "",
    );

    expect(errores(caso)).toContain(
      "Cuerpo: falta la sección «# Solución comentada».",
    );
  });

  test("ninguna opción es correcta", () => {
    const caso = sinLinea(casoValido, "    correcta: true");

    expect(errores(caso)).toContain(
      "Cabecera: debe haber exactamente una opción correcta y hay 0.",
    );
  });

  test("hay más de una opción correcta", () => {
    const caso = casoValido.replace(
      "    texto: El vecino del quinto\n",
      "    texto: El vecino del quinto\n    correcta: true\n",
    );

    expect(errores(caso)).toContain(
      "Cabecera: debe haber exactamente una opción correcta y hay 2.",
    );
  });

  test("hay menos de dos opciones", () => {
    const caso = casoValido
      .replace("  - id: vecino\n    texto: El vecino del quinto\n", "")
      .replace(/# Error comentado: vecino[\s\S]*$/, "");

    expect(errores(caso)).toContain(
      "Cabecera: el caso necesita al menos dos opciones y tiene 1.",
    );
  });

  test("falta la lección", () => {
    const caso = casoValido.replace(
      "# Lección\n\nLa memoria no es una grabación.\n\n",
      "",
    );

    expect(errores(caso)).toContain("Cuerpo: falta la sección «# Lección».");
  });

  test("falta un campo obligatorio de la cabecera", () => {
    const caso = sinLinea(casoValido, "pregunta: ¿Qué testigo es fiable?");

    expect(errores(caso)).toContain(
      "Cabecera: falta el campo obligatorio «pregunta».",
    );
  });

  test("un caso válido se carga con todo su contenido", () => {
    const resultado = cargarCaso(casoValido);

    expect(resultado).toEqual({
      ok: true,
      caso: {
        id: "el-portal",
        titulo: "El portal",
        concepto: "Fiabilidad del testimonio",
        pregunta: "¿Qué testigo es fiable?",
        leccion: "La memoria no es una grabación.",
        opciones: [
          {
            id: "portera",
            texto: "La portera",
            correcta: true,
            comentario: "La portera estaba cerca y con buena luz.",
          },
          {
            id: "vecino",
            texto: "El vecino del quinto",
            correcta: false,
            comentario:
              "El vecino estaba muy seguro, pero la seguridad no predice la exactitud.",
          },
        ],
        escena: {
          imagen: "el-portal/escena.svg",
          puntos: [
            { detalle: "farola", etiqueta: "La farola", x: 20, y: 35 },
            {
              detalle: "declaracion-vecino",
              etiqueta: "Declaración del vecino",
              x: 70.5,
              y: 60,
            },
          ],
        },
        detalles: [
          {
            id: "farola",
            titulo: "La farola del portal",
            tipo: "ilustracion",
            imagen: "el-portal/farola.svg",
            texto: "",
          },
          {
            id: "declaracion-vecino",
            titulo: "Declaración del vecino",
            tipo: "documento",
            texto: "«Lo vi clarísimo desde mi ventana.»",
          },
        ],
      },
    });
  });
});
