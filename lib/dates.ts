export function daysUntil(date: string): number {
  return Math.max(
    Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    0,
  );
}
