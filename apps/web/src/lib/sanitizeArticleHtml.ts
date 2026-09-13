import sanitizeHtml from "sanitize-html";

const ALIGNABLE = ["p", "h2", "h3"];

/** Limpa o HTML do editor rico antes de salvar — só as tags de um artigo
    editorial (sem scripts, imagens embutidas ou estilos inline), com
    exceção do alinhamento de texto (text-align) nos blocos de texto. */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "a", "br"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      ...Object.fromEntries(ALIGNABLE.map(tag => [tag, ["style"]])),
    },
    allowedStyles: {
      "*": { "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/] },
    },
  });
}
