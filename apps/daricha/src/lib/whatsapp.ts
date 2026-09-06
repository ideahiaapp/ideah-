export function buildWhatsAppLink(message: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

export const CTA_MESSAGE =
  "Oi! Conheci a Iniciação e Qualificação em Terapêutica Tântrica e quero saber mais sobre a formação.";
