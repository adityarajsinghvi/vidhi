import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRupees } from "@/lib/money";
import { colorForCategory, initialsFor } from "@/lib/vendor-category";

export default async function SharedWeddingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, couple_names, start_date, budget_total")
    .eq("share_token", token)
    .maybeSingle();

  if (!wedding) {
    notFound();
  }

  const [{ data: ceremonies }, { data: vendors }] = await Promise.all([
    supabase
      .from("ceremonies")
      .select("id, name, date, venue")
      .eq("wedding_id", wedding.id)
      .order("date", { ascending: true }),
    supabase
      .from("vendors")
      .select("id, name, category, quoted_amount")
      .eq("wedding_id", wedding.id),
  ]);

  const vendorIds = (vendors ?? []).map((v) => v.id);
  const { data: payments } =
    vendorIds.length > 0
      ? await supabase.from("payments").select("vendor_id, amount").in("vendor_id", vendorIds)
      : { data: [] as { vendor_id: string; amount: number }[] };

  const paidByVendor = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByVendor.set(p.vendor_id, (paidByVendor.get(p.vendor_id) ?? 0) + p.amount);
  }

  const totalQuoted = (vendors ?? []).reduce((sum, v) => sum + v.quoted_amount, 0);
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const paidPct =
    wedding.budget_total > 0
      ? Math.min(Math.round((totalPaid / wedding.budget_total) * 100), 100)
      : 0;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-screen px-5 pt-[60px] pb-16">
      <div className="mb-1 text-[13px] text-muted">Wedding overview</div>
      <div className="mb-5 font-display text-[28px] leading-tight tracking-[0.01em] text-ink">
        {wedding.couple_names}
      </div>
      {wedding.start_date && (
        <div className="mb-5 text-[13px] font-medium text-accent">
          {new Date(wedding.start_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      )}

      <div className="mb-[22px] rounded-card border border-field-border bg-card p-5 shadow-card">
        <div className="mb-3.5 flex items-baseline justify-between">
          <span className="text-[13px] text-muted">Paid so far</span>
          <span className="text-xs text-faint">of {formatRupees(wedding.budget_total)}</span>
        </div>
        <div className="font-mono text-[32px] font-semibold leading-none tracking-tight text-ink">
          {formatRupees(totalPaid)}
        </div>
        <div className="my-4 flex h-2 overflow-hidden rounded-full bg-track">
          <div className="bg-accent" style={{ width: `${paidPct}%` }} />
        </div>
        <div className="text-xs text-muted">
          {paidPct}% of the budget paid across {(vendors ?? []).length} vendors
        </div>
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Ceremonies</div>
      <div className="mb-[22px] flex flex-col gap-2.5">
        {(ceremonies ?? []).length === 0 && (
          <p className="text-sm text-muted">No ceremonies added yet.</p>
        )}
        {(ceremonies ?? []).map((c) => (
          <div
            key={c.id}
            className="rounded-card border border-field-border bg-card p-3.5 shadow-card"
          >
            <div className="text-sm font-semibold text-ink">{c.name}</div>
            <div className="mt-0.5 text-xs text-muted">
              {c.date
                ? new Date(c.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Date to be decided"}
              {c.venue && ` · ${c.venue}`}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Vendors</div>
      <div className="flex flex-col gap-2.5">
        {(vendors ?? []).length === 0 && (
          <p className="text-sm text-muted">No vendors added yet.</p>
        )}
        {(vendors ?? []).map((v) => {
          const paid = paidByVendor.get(v.id) ?? 0;
          const isPaidUp = paid >= v.quoted_amount && v.quoted_amount > 0;
          return (
            <div
              key={v.id}
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
              <div className={`text-xs font-medium ${isPaidUp ? "text-accent" : "text-muted"}`}>
                {isPaidUp ? "Paid up" : "In progress"}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-faint">Shared from Vidhi · view only</p>
    </div>
  );
}
