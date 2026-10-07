import { marked } from "marked";

/** Convierte el texto Markdown de una sección del caso en HTML. */
export function html(markdown: string): string {
  return marked.parse(markdown, { async: false });
}
