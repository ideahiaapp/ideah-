import sanitizeHtml from "sanitize-html";

/** Limpa o HTML do editor rico antes de salvar — só as tags de um artigo
    editorial (sem scripts, imagens embutidas ou estilos inline). */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "a", "br"],
    allowedAttributes: { a: ["href", "target", "rel"] },
  });
}
