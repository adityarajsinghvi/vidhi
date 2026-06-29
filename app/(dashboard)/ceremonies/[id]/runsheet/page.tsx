import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";
import { createRunSheetItem, toggleRunSheetItem } from "./actions";
import { DeleteItemButton } from "./delete-item-button";

export default async function RunSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const wedding = await requireWedding();
  const supabase = await createClient();

  const { data: ceremony } = await supabase
    .from("ceremonies")
    .select("id, name")
    .eq("id", id)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (!ceremony) {
    notFound();
  }

  const { data: items } = await supabase
    .from("run_sheet_items")
    .select("id, time, title, notes, done, sort_order")
    .eq("ceremony_id", ceremony.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/dashboard" className="text-lg text-muted">
          ←
        </Link>
        <div className="flex-1 font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          {ceremony.name} — run sheet
        </div>
        {can.manageCeremonies(wedding.role) && (
          <Link href={`/ceremonies/${ceremony.id}/edit`} className="text-sm font-medium text-accent">
            Edit
          </Link>
        )}
      </div>

      <p className="mb-[18px] text-sm text-muted">
        The minute-by-minute plan for the day. Anyone on the team can tick items off as they
        happen.
      </p>

      <form
        action={createRunSheetItem}
        className="mb-[22px] flex flex-col gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
      >
        <input type="hidden" name="ceremonyId" value={ceremony.id} />
        <div className="flex gap-2.5">
          <input
            name="time"
            type="time"
            className="w-[120px] rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
          />
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Baraat assembles"
            className="flex-1 rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>
        <input
          name="notes"
          type="text"
          placeholder="Notes (optional)"
          className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Add to run sheet
        </button>
      </form>

      <div className="flex flex-col gap-2.5">
        {(items ?? []).length === 0 && (
          <p className="text-sm text-muted">Nothing on the run sheet yet — add the first item above.</p>
        )}
        {(items ?? []).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
          >
            <form action={toggleRunSheetItem} className="flex flex-1 items-center gap-3 min-w-0">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="ceremonyId" value={ceremony.id} />
              <input type="hidden" name="nextDone" value={String(!item.done)} />
              <button
                type="submit"
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs ${
                  item.done
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-field-border bg-field text-transparent"
                }`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-medium ${item.done ? "text-muted line-through" : "text-ink"}`}
                >
                  {item.time && (
                    <span className="mr-2 font-mono text-xs text-accent">
                      {item.time.slice(0, 5)}
                    </span>
                  )}
                  {item.title}
                </div>
                {item.notes && <div className="text-xs text-muted">{item.notes}</div>}
              </div>
            </form>
            <DeleteItemButton itemId={item.id} ceremonyId={ceremony.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
