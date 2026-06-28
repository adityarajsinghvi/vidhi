// Lakh/crore-grouped ₹ formatting, ported from the prototype's fmt().
// e.g. 1850000 -> "₹18,50,000"
export function formatRupees(amountPaise: number): string {
  const n = Math.round(amountPaise);
  const s = n.toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") : "";
  return "₹" + (grouped ? grouped + "," : "") + last3;
}
