import { expect, test } from "vitest";
import { leerCasosDelLibro } from "./libro";

test("todos los casos del libro se cargan sin errores", () => {
  const casos = leerCasosDelLibro();

  expect(casos.length).toBeGreaterThan(0);
  for (const { archivo, resultado } of casos) {
    expect(resultado.ok ? [] : resultado.errores, archivo).toEqual([]);
  }
});
