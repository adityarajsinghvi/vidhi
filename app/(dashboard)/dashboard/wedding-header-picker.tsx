import Link from "next/link";
import { listWeddings, requireWedding } from "@/lib/weddings";
import { switchWedding } from "../more/wedding-actions";

// requireWedding()/listWeddings() are cached per-request, so calling them
// again here costs nothing extra on top of the page's own call.
export async function WeddingHeaderPicker() {
  const [weddings, active] = await Promise.all([listWeddings(), requireWedding()]);

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
        <div>
          <div className="text-[13px] text-muted">Wedding</div>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[26px] leading-tight tracking-[0.01em] text-ink">
              {active.couple_names}
            </span>
            {weddings.length > 1 && (
              <svg viewBox="0 0 20 20" fill="none" className="mt-1 h-4 w-4 flex-shrink-0 text-muted">
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </summary>

      <div className="absolute left-0 z-30 mt-1.5 w-64 rounded-card border border-field-border bg-card p-2 shadow-card">
        {weddings.map((w) => {
          const isActive = w.id === active.id;
          return (
            <form key={w.id} action={switchWedding}>
              <input type="hidden" name="weddingId" value={w.id} />
              <button
                type="submit"
                disabled={isActive}
                className={`flex w-full items-center justify-between rounded-btn px-3 py-2.5 text-left text-sm ${
                  isActive ? "bg-accent-glow font-medium text-accent" : "text-ink hover:bg-field"
                }`}
              >
                {w.couple_names}
                {isActive && <span className="text-xs">Active</span>}
              </button>
            </form>
          );
        })}
        <Link
          href="/new-wedding"
          className="mt-1 flex items-center gap-1.5 rounded-btn px-3 py-2.5 text-sm font-medium text-accent hover:bg-field"
        >
          <span className="text-base">＋</span> Add wedding
        </Link>
      </div>
    </details>
  );
}
