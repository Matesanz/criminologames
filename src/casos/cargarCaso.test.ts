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
---

# Lección

La memoria no es una grabación.

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
      },
    });
  });
});
