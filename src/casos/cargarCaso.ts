import { parse } from "yaml";

export interface Opcion {
  id: string;
  texto: string;
  correcta: boolean;
  /** Solución comentada si la opción es correcta; error comentado si no. */
  comentario: string;
}

export interface Caso {
  id: string;
  titulo: string;
  concepto: string;
  pregunta: string;
  leccion: string;
  opciones: Opcion[];
}

export type ResultadoCarga =
  | { ok: true; caso: Caso }
  | { ok: false; errores: string[] };

const CABECERA = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export function cargarCaso(markdown: string): ResultadoCarga {
  const partes = CABECERA.exec(markdown.replace(/\r\n/g, "\n"));
  if (!partes) {
    return {
      ok: false,
      errores: [
        "Cabecera: el archivo debe empezar con una cabecera entre líneas «---».",
      ],
    };
  }
  const [, cabeceraYaml, cuerpo] = partes;
  let cabecera;
  try {
    cabecera = parse(cabeceraYaml) ?? {};
  } catch (e) {
    return {
      ok: false,
      errores: [`Cabecera: el YAML no es válido (${(e as Error).message}).`],
    };
  }
  const secciones = leerSecciones(cuerpo);
  const errores: string[] = [];

  for (const campo of ["id", "titulo", "concepto", "pregunta"]) {
    if (typeof cabecera[campo] !== "string" || cabecera[campo].trim() === "") {
      errores.push(`Cabecera: falta el campo obligatorio «${campo}».`);
    }
  }

  for (const seccion of ["Lección", "Solución comentada"]) {
    if (!secciones.get(seccion)) {
      errores.push(`Cuerpo: falta la sección «# ${seccion}».`);
    }
  }

  const opcionesCabecera = Array.isArray(cabecera.opciones)
    ? cabecera.opciones
    : [];
  if (opcionesCabecera.length < 2) {
    errores.push(
      `Cabecera: el caso necesita al menos dos opciones y tiene ${opcionesCabecera.length}.`,
    );
  }

  opcionesCabecera.forEach((o: Record<string, unknown> | null, i: number) => {
    for (const campo of ["id", "texto"]) {
      const valor = o?.[campo];
      if (typeof valor !== "string" || valor.trim() === "") {
        errores.push(
          `Cabecera: a la opción ${i + 1} le falta el campo obligatorio «${campo}».`,
        );
      }
    }
  });

  const vistos = new Set<unknown>();
  for (const o of opcionesCabecera) {
    if (vistos.has(o?.id)) {
      errores.push(
        `Cabecera: el identificador de opción «${o?.id}» está repetido.`,
      );
    }
    vistos.add(o?.id);
  }

  const correctas = opcionesCabecera.filter(
    (o: { correcta?: unknown }) => o?.correcta === true,
  ).length;
  if (correctas !== 1) {
    errores.push(
      `Cabecera: debe haber exactamente una opción correcta y hay ${correctas}.`,
    );
  }

  for (const o of opcionesCabecera) {
    if (o?.correcta === true) continue;
    if (!secciones.get(`Error comentado: ${o?.id}`)) {
      errores.push(
        `Cuerpo: la opción incorrecta «${o?.id}» no tiene su sección «# Error comentado: ${o?.id}».`,
      );
    }
  }

  const incorrectas = new Set(
    opcionesCabecera
      .filter((o: { correcta?: unknown }) => o?.correcta !== true)
      .map((o: { id?: unknown }) => o?.id),
  );
  for (const titulo of secciones.keys()) {
    const error = /^Error comentado: (.+)$/.exec(titulo);
    if (error && !incorrectas.has(error[1])) {
      errores.push(
        `Cuerpo: la sección «# ${titulo}» no corresponde a ninguna opción incorrecta.`,
      );
    }
  }

  if (errores.length > 0) return { ok: false, errores };

  const opciones: Opcion[] = opcionesCabecera.map(
    (o: { id: string; texto: string; correcta?: boolean }) => {
      const correcta = o.correcta === true;
      return {
        id: o.id,
        texto: o.texto,
        correcta,
        comentario: correcta
          ? secciones.get("Solución comentada")!
          : secciones.get(`Error comentado: ${o.id}`)!,
      };
    },
  );

  return {
    ok: true,
    caso: {
      id: cabecera.id,
      titulo: cabecera.titulo,
      concepto: cabecera.concepto,
      pregunta: cabecera.pregunta,
      leccion: secciones.get("Lección")!,
      opciones,
    },
  };
}

/** Divide el cuerpo en secciones por sus encabezados de primer nivel. */
function leerSecciones(cuerpo: string): Map<string, string> {
  const secciones = new Map<string, string>();
  let titulo: string | undefined;
  let lineas: string[] = [];
  const cerrar = () => {
    if (titulo !== undefined) secciones.set(titulo, lineas.join("\n").trim());
  };
  for (const linea of cuerpo.split("\n")) {
    const encabezado = /^# (.+)$/.exec(linea);
    if (encabezado) {
      cerrar();
      titulo = encabezado[1].trim();
      lineas = [];
    } else {
      lineas.push(linea);
    }
  }
  cerrar();
  return secciones;
}
