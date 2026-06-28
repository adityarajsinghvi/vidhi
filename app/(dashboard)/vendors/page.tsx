import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { formatRupees } from "@/lib/money";
import { colorForCategory, initialsFor } from "@/lib/vendor-category";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const wedding = await requireWedding();
  const supabase = await createClient();

  let query = supabase
    .from("vendors")
    .select("id, name, category, quoted_amount")
    .eq("wedding_id", wedding.id)
    .order("name", { ascending: true });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: vendors } = await query;
  const vendorIds = (vendors ?? []).map((v) => v.id);
  const { data: payments } =
    vendorIds.length > 0
      ? await supabase
          .from("payments")
          .select("vendor_id, amount")
          .in("vendor_id", vendorIds)
      : { data: [] as { vendor_id: string; amount: number }[] };

  const paidByVendor = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByVendor.set(p.vendor_id, (paidByVendor.get(p.vendor_id) ?? 0) + p.amount);
  }

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="font-display text-[26px] leading-tight tracking-[0.01em] text-ink">
          Vendors
        </div>
        <Link
          href="/vendors/new"
          className="flex h-9 w-9 items-center justify-center rounded-avatar bg-accent text-lg font-semibold text-accent-ink"
        >
          ＋
        </Link>
      </div>

      <form className="mb-5">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search vendors"
          className="w-full rounded-btn border border-field-border bg-field px-4 py-3 text-sm text-ink outline-none placeholder:text-faint"
        />
      </form>

      <div className="flex flex-col gap-2.5">
        {(vendors ?? []).length === 0 && (
          <p className="text-sm text-muted">
            {q ? "No vendors match your search." : "No vendors yet — add your first one."}
          </p>
        )}
        {(vendors ?? []).map((v) => {
          const pending = v.quoted_amount - (paidByVendor.get(v.id) ?? 0);
          return (
            <Link
              key={v.id}
              href={`/vendors/${v.id}`}
              className="flex items-center gap-3.5 rounded-card border border-field-border bg-card p-3.5 shadow-card"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-avatar text-sm font-semibold text-white"
                style={{ background: colorForCategory(v.category) }}
              >
                {initialsFor(v.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">{v.name}</div>
                <div className="text-xs text-muted">{v.category}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-ink">
                  {formatRupees(v.quoted_amount)}
                </div>
                <div className="text-[11px] text-muted">
                  {pending > 0 ? `${formatRupees(pending)} due` : "Paid up"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
