import DOMPurify from "isomorphic-dompurify";

/** Limpa o HTML do editor rico antes de salvar — só as tags de um artigo
    editorial (sem scripts, imagens embutidas ou estilos inline). */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "a", "br"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}
