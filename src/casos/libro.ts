import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cargarCaso, type Caso, type ResultadoCarga } from "./cargarCaso";

const CARPETA_CASOS = join(process.cwd(), "contenido", "casos");

/** Carga cada archivo de caso del libro, con o sin errores. */
export function leerCasosDelLibro(): { archivo: string; resultado: ResultadoCarga }[] {
  return readdirSync(CARPETA_CASOS)
    .filter((archivo) => archivo.endsWith(".md"))
    .sort()
    .map((archivo) => ({
      archivo,
      resultado: cargarCaso(readFileSync(join(CARPETA_CASOS, archivo), "utf8")),
    }));
}

/** Los casos del libro, listos para la web. Falla si alguno tiene errores. */
export function casosDelLibro(): Caso[] {
  const casos = leerCasosDelLibro();
  const fallos = casos.flatMap(({ archivo, resultado }) =>
    resultado.ok ? [] : resultado.errores.map((e) => `${archivo}: ${e}`),
  );
  if (fallos.length > 0) {
    throw new Error(`Hay casos con errores:\n${fallos.join("\n")}`);
  }
  return casos.map(({ resultado }) => (resultado as { caso: Caso }).caso);
}
