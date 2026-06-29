// Display helper for the E.164-without-plus phone strings Supabase stores
// (e.g. "917014374566" -> "+91 70143 74566").
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  if (ten.length === 10) return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  return raw;
}
