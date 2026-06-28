// Resolves a model-guessed name against a known list by case-insensitive
// substring match in either direction — good enough for short vendor/task
// names and avoids pulling in a real fuzzy-matching dependency for v1.
export function fuzzyFind<T extends { id: string; name: string }>(
  candidates: T[],
  query: string | null,
): T | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const exact = candidates.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;

  const partial = candidates.find(
    (c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()),
  );
  return partial ?? null;
}
