import Link from "next/link";
import { listWeddings, requireWedding } from "@/lib/weddings";
import { switchWedding } from "./wedding-actions";

export async function WeddingSwitcher() {
  const [weddings, active] = await Promise.all([listWeddings(), requireWedding()]);

  return (
    <div className="flex flex-col gap-2.5">
      {weddings.map((w) => {
        const isActive = w.id === active.id;
        return (
          <div
            key={w.id}
            className={`flex items-center gap-2 rounded-card border p-3.5 ${
              isActive ? "border-accent bg-accent-glow" : "border-field-border bg-field"
            }`}
          >
            <form action={switchWedding} className="min-w-0 flex-1">
              <input type="hidden" name="weddingId" value={w.id} />
              <button type="submit" disabled={isActive} className="w-full text-left">
                <div className="text-sm font-semibold text-ink">{w.couple_names}</div>
                {w.start_date && (
                  <div className="mt-0.5 text-xs text-muted">
                    {new Date(w.start_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                )}
              </button>
            </form>
            {isActive && <span className="text-xs font-medium text-accent">Active</span>}
            <Link href={`/weddings/${w.id}/edit`} className="text-xs font-medium text-muted">
              Edit
            </Link>
          </div>
        );
      })}

      <Link
        href="/new-wedding"
        className="flex items-center justify-center gap-1.5 rounded-card border border-dashed border-field-border py-3.5 text-sm font-medium text-accent"
      >
        <span className="text-lg">＋</span> Add another wedding
      </Link>
    </div>
  );
}
