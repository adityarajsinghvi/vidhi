// Pure wa.me link builder — no server involvement, per design.md's
// requirement that WhatsApp messaging stays 100% client-side.
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
