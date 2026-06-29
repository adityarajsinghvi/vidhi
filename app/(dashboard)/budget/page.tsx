import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";
import { formatRupees } from "@/lib/money";
import { VENDOR_CATEGORIES } from "@/lib/vendor-category";
import { BudgetAllocationForm } from "./budget-allocation-form";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const wedding = await requireWedding();
  if (!can.viewMoney(wedding.role)) {
    redirect("/dashboard");
  }
  const supabase = await createClient();

  const [{ data: vendors }, { data: categories }] = await Promise.all([
    supabase.from("vendors").select("id, category, quoted_amount").eq("wedding_id", wedding.id),
    supabase.from("budget_categories").select("name, allocated_amount").eq("wedding_id", wedding.id),
  ]);

  const vendorIds = (vendors ?? []).map((v) => v.id);
  const { data: payments } =
    vendorIds.length > 0
      ? await supabase
          .from("payments")
          .select("vendor_id, amount")
          .in("vendor_id", vendorIds)
      : { data: [] as { vendor_id: string; amount: number }[] };

  const vendorCategoryById = new Map((vendors ?? []).map((v) => [v.id, v.category]));
  const allocatedByCategory = new Map((categories ?? []).map((c) => [c.name, c.allocated_amount]));

  const committedByCategory = new Map<string, number>();
  for (const v of vendors ?? []) {
    committedByCategory.set(
      v.category,
      (committedByCategory.get(v.category) ?? 0) + v.quoted_amount,
    );
  }

  const paidByCategory = new Map<string, number>();
  for (const p of payments ?? []) {
    const category = vendorCategoryById.get(p.vendor_id);
    if (!category) continue;
    paidByCategory.set(category, (paidByCategory.get(category) ?? 0) + p.amount);
  }

  const categoriesInUse = new Set([
    ...VENDOR_CATEGORIES,
    ...(vendors ?? []).map((v) => v.category),
    ...(categories ?? []).map((c) => c.name),
  ]);

  const rows = [...categoriesInUse].map((name) => ({
    name,
    allocated: allocatedByCategory.get(name) ?? 0,
    committed: committedByCategory.get(name) ?? 0,
    paid: paidByCategory.get(name) ?? 0,
  }));

  const totalAllocated = rows.reduce((sum, r) => sum + r.allocated, 0);
  const totalCommitted = rows.reduce((sum, r) => sum + r.committed, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/more" className="text-lg text-muted">
          ←
        </Link>
        <div className="font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          Budget breakdown
        </div>
      </div>

      <div className="mb-[18px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <div className="flex gap-[18px]">
          <Stat label="Allocated" value={formatRupees(totalAllocated)} />
          <Stat label="Committed" value={formatRupees(totalCommitted)} />
          <Stat label="Paid" value={formatRupees(totalPaid)} />
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <div className="mb-[18px] flex flex-col gap-2">
        {rows.map((r) => {
          const overCommitted = r.allocated > 0 && r.committed > r.allocated;
          return (
            <div
              key={r.name}
              className="flex items-center justify-between gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink">{r.name}</div>
                <div className="text-xs text-muted">
                  Committed {formatRupees(r.committed)} · Paid {formatRupees(r.paid)}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-mono text-sm font-medium text-ink">
                  {r.allocated > 0 ? formatRupees(r.allocated) : "—"}
                </div>
                {overCommitted && (
                  <div className="text-[11px] font-medium text-red-500">over allocation</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Set a category budget</div>
      <BudgetAllocationForm rows={rows} />
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.04em] text-faint">{label}</div>
      <div className={`font-mono ${small ? "text-sm" : "text-[15px]"} font-medium text-ink`}>
        {value}
      </div>
    </div>
  );
}
