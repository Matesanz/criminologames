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
  escena: Escena;
  detalles: Detalle[];
}

export interface Escena {
  imagen: string;
  puntos: Punto[];
}

/** Un punto marcado en la escena que el lector puede examinar. */
export interface Punto {
  /** Identificador del detalle que se abre al examinarlo. */
  detalle: string;
  etiqueta: string;
  /** Posición sobre la imagen, en % del ancho (x) y del alto (y). */
  x: number;
  y: number;
}

export type Detalle =
  | { id: string; titulo: string; tipo: "ilustracion"; imagen: string; texto: string }
  | { id: string; titulo: string; tipo: "documento"; texto: string };

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

  const escena = cabecera.escena;
  const puntosCabecera = Array.isArray(escena?.puntos) ? escena.puntos : [];
  if (escena == null || typeof escena !== "object") {
    errores.push("Cabecera: falta la «escena».");
  } else {
    if (typeof escena.imagen !== "string" || escena.imagen.trim() === "") {
      errores.push("Cabecera: a la escena le falta el campo obligatorio «imagen».");
    }
    if (puntosCabecera.length === 0) {
      errores.push("Cabecera: la escena necesita al menos un punto que examinar.");
    }
  }

  puntosCabecera.forEach((p: Record<string, unknown> | null, i: number) => {
    for (const eje of ["x", "y"]) {
      const valor = p?.[eje];
      if (typeof valor !== "number" || valor < 0 || valor > 100) {
        errores.push(
          `Cabecera: el punto ${i + 1} de la escena tiene «${eje}» fuera de la imagen (debe estar entre 0 y 100 y es ${valor}).`,
        );
      }
    }
  });

  const detallesCabecera = Array.isArray(cabecera.detalles)
    ? cabecera.detalles
    : [];
  const idsDetalles = new Set(
    detallesCabecera.map((d: { id?: unknown } | null) => d?.id),
  );
  const abiertos = new Set(
    puntosCabecera.map((p: { detalle?: unknown } | null) => p?.detalle),
  );
  puntosCabecera.forEach((p: { detalle?: unknown } | null, i: number) => {
    if (!idsDetalles.has(p?.detalle)) {
      errores.push(
        `Cabecera: el punto ${i + 1} de la escena abre el detalle «${p?.detalle}», que no existe.`,
      );
    }
  });
  for (const id of idsDetalles) {
    if (!abiertos.has(id)) {
      errores.push(`Cabecera: ningún punto de la escena abre el detalle «${id}».`);
    }
  }

  puntosCabecera.forEach((p: Record<string, unknown> | null, i: number) => {
    if (typeof p?.etiqueta !== "string" || p.etiqueta.trim() === "") {
      errores.push(
        `Cabecera: al punto ${i + 1} de la escena le falta el campo obligatorio «etiqueta».`,
      );
    }
  });

  detallesCabecera.forEach((d: Record<string, unknown> | null, i: number) => {
    for (const campo of ["id", "titulo"]) {
      const valor = d?.[campo];
      if (typeof valor !== "string" || valor.trim() === "") {
        errores.push(
          `Cabecera: al detalle ${i + 1} le falta el campo obligatorio «${campo}».`,
        );
      }
    }
  });

  const detallesVistos = new Set<unknown>();
  for (const d of detallesCabecera) {
    if (detallesVistos.has(d?.id)) {
      errores.push(
        `Cabecera: el identificador de detalle «${d?.id}» está repetido.`,
      );
    }
    detallesVistos.add(d?.id);
  }

  for (const titulo of secciones.keys()) {
    const detalle = /^Detalle: (.+)$/.exec(titulo);
    if (detalle && !idsDetalles.has(detalle[1])) {
      errores.push(
        `Cuerpo: la sección «# ${titulo}» no corresponde a ningún detalle.`,
      );
    }
  }

  for (const d of detallesCabecera) {
    if (d?.tipo === "ilustracion") {
      if (typeof d.imagen !== "string" || d.imagen.trim() === "") {
        errores.push(
          `Cabecera: al detalle «${d.id}» le falta el campo obligatorio «imagen».`,
        );
      }
    } else if (d?.tipo === "documento") {
      if (!secciones.get(`Detalle: ${d.id}`)) {
        errores.push(
          `Cuerpo: el documento «${d.id}» no tiene su sección «# Detalle: ${d.id}».`,
        );
      }
    } else {
      errores.push(
        `Cabecera: el detalle «${d?.id}» tiene el tipo «${d?.tipo}»; debe ser «ilustracion» o «documento».`,
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
      escena: {
        imagen: cabecera.escena.imagen,
        puntos: cabecera.escena.puntos.map(
          (p: Punto): Punto => ({
            detalle: p.detalle,
            etiqueta: p.etiqueta,
            x: p.x,
            y: p.y,
          }),
        ),
      },
      detalles: cabecera.detalles.map((d: Detalle): Detalle => {
        const texto = secciones.get(`Detalle: ${d.id}`) ?? "";
        return d.tipo === "ilustracion"
          ? { id: d.id, titulo: d.titulo, tipo: d.tipo, imagen: d.imagen, texto }
          : { id: d.id, titulo: d.titulo, tipo: d.tipo, texto };
      }),
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
