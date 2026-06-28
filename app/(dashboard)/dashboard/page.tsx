import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { formatRupees } from "@/lib/money";
import { colorForCategory, initialsFor } from "@/lib/vendor-category";
import { daysUntil } from "@/lib/dates";

export default async function DashboardPage() {
  const wedding = await requireWedding();
  const supabase = await createClient();

  const [{ data: ceremonies }, { data: vendors }] = await Promise.all([
    supabase
      .from("ceremonies")
      .select("id, name, date")
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
      ? await supabase
          .from("payments")
          .select("vendor_id, amount")
          .in("vendor_id", vendorIds)
      : { data: [] as { vendor_id: string; amount: number }[] };

  const paidByVendor = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByVendor.set(p.vendor_id, (paidByVendor.get(p.vendor_id) ?? 0) + p.amount);
  }

  const totalQuoted = (vendors ?? []).reduce((sum, v) => sum + v.quoted_amount, 0);
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const pending = Math.max(totalQuoted - totalPaid, 0);
  const paidPct =
    wedding.budget_total > 0
      ? Math.min(Math.round((totalPaid / wedding.budget_total) * 100), 100)
      : 0;

  const daysToGo = wedding.start_date ? daysUntil(wedding.start_date) : null;

  const attention = (vendors ?? [])
    .map((v) => ({
      ...v,
      pendingAmount: v.quoted_amount - (paidByVendor.get(v.id) ?? 0),
    }))
    .filter((v) => v.pendingAmount > 0)
    .sort((a, b) => b.pendingAmount - a.pendingAmount)
    .slice(0, 5);

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="text-[13px] text-muted">Wedding</div>
          <div className="font-display text-[26px] leading-tight tracking-[0.01em] text-ink">
            {wedding.couple_names}
          </div>
          {wedding.start_date && (
            <div className="mt-0.5 text-[13px] font-medium text-accent">
              {new Date(wedding.start_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {daysToGo !== null && ` · ${daysToGo} days to go`}
            </div>
          )}
        </div>
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-avatar border border-field-border bg-field font-display text-lg text-accent">
          व
        </div>
      </div>

      <div className="mb-[18px] rounded-card border border-field-border bg-card p-5 shadow-card">
        <div className="mb-3.5 flex items-baseline justify-between">
          <span className="text-[13px] text-muted">Pending across all vendors</span>
          <span className="text-xs text-faint">of {formatRupees(wedding.budget_total)}</span>
        </div>
        <div className="font-mono text-[36px] font-semibold leading-none tracking-tight text-ink">
          {formatRupees(pending)}
        </div>
        <div className="my-4 flex h-2 overflow-hidden rounded-full bg-track">
          <div className="bg-accent" style={{ width: `${paidPct}%` }} />
        </div>
        <div className="flex gap-[18px]">
          <Stat label="Paid" value={formatRupees(totalPaid)} />
          <Stat label="Committed" value={formatRupees(totalQuoted)} />
          <Stat label="Vendors" value={String((vendors ?? []).length)} />
        </div>
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">Ceremonies</span>
        <span className="text-[13px] text-accent">{(ceremonies ?? []).length} events</span>
      </div>
      <div className="-mx-5 mb-[22px] flex gap-2.5 overflow-x-auto px-5">
        {(ceremonies ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/ceremonies/${c.id}/edit`}
            className="w-[124px] flex-shrink-0 rounded-card border border-field-border bg-card p-3.5 shadow-card"
          >
            <div className="mb-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-accent-glow text-[13px] font-semibold text-accent">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-ink">{c.name}</div>
            <div className="mt-0.5 text-xs text-muted">
              {c.date
                ? new Date(c.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : "No date yet"}
            </div>
          </Link>
        ))}
        <Link
          href="/ceremonies/new"
          className="flex w-[124px] flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-field-border text-accent"
        >
          <span className="text-xl">＋</span>
          <span className="text-xs font-medium">Add ceremony</span>
        </Link>
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Needs your attention</div>
      <div className="flex flex-col gap-2.5">
        {attention.length === 0 && (
          <p className="text-sm text-muted">Every vendor is fully paid up.</p>
        )}
        {attention.map((v) => (
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
                {formatRupees(v.pendingAmount)}
              </div>
              <div className="text-[11px] text-accent">balance due</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.04em] text-faint">{label}</div>
      <div className="font-mono text-[15px] font-medium text-ink">{value}</div>
    </div>
  );
}
