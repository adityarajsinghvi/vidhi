import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { formatRupees } from "@/lib/money";
import { colorForCategory, initialsFor } from "@/lib/vendor-category";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wedding = await requireWedding();
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, category, phone, quoted_amount, notes")
    .eq("id", id)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (!vendor) {
    notFound();
  }

  const [{ data: payments }, { data: links }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, amount, mode, type, paid_at, notes")
      .eq("vendor_id", vendor.id)
      .order("paid_at", { ascending: false }),
    supabase
      .from("vendor_ceremony")
      .select("ceremonies(id, name)")
      .eq("vendor_id", vendor.id),
  ]);

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(vendor.quoted_amount - totalPaid, 0);
  const ceremonyNames = (links ?? [])
    .flatMap((l) => (Array.isArray(l.ceremonies) ? l.ceremonies : [l.ceremonies]))
    .map((c) => c?.name)
    .filter((n): n is string => Boolean(n));

  const waLink = vendor.phone
    ? buildWhatsAppLink(
        vendor.phone,
        `Hi ${vendor.name}, following up on payments for ${wedding.couple_names}'s wedding.`,
      )
    : null;

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/vendors" className="text-lg text-muted">
          ←
        </Link>
        <div className="font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          Vendor
        </div>
      </div>

      <div className="mb-[18px] flex items-center gap-3.5">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-avatar text-base font-semibold text-white"
          style={{ background: colorForCategory(vendor.category) }}
        >
          {initialsFor(vendor.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-ink">{vendor.name}</div>
          <div className="text-sm text-muted">
            {vendor.category}
            {ceremonyNames.length > 0 && ` · ${ceremonyNames.join(", ")}`}
          </div>
        </div>
      </div>

      <div className="mb-[18px] flex gap-2.5">
        <div className="flex-1 rounded-card border border-field-border bg-card p-3.5 shadow-card">
          <div className="text-[11px] uppercase tracking-[0.04em] text-faint">Paid</div>
          <div className="mt-1 font-mono text-base font-semibold text-ink">
            {formatRupees(totalPaid)}
          </div>
        </div>
        <div className="flex-1 rounded-card border border-field-border bg-card p-3.5 shadow-card">
          <div className="text-[11px] uppercase tracking-[0.04em] text-faint">Balance due</div>
          <div className="mt-1 font-mono text-base font-semibold text-ink">
            {formatRupees(balance)}
          </div>
        </div>
      </div>

      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-[18px] flex items-center justify-center gap-2 rounded-btn border border-field-border bg-card px-4 py-3.5 text-sm font-semibold text-ink shadow-card"
        >
          <span className="text-lg">💬</span> Message on WhatsApp
        </a>
      )}

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Payment history</div>
      <div className="flex flex-col gap-2.5">
        {(payments ?? []).length === 0 && (
          <p className="text-sm text-muted">No payments recorded yet.</p>
        )}
        {(payments ?? []).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-card border border-field-border bg-card p-3.5 shadow-card"
          >
            <div>
              <div className="text-sm font-semibold capitalize text-ink">
                {p.type} · {p.mode}
              </div>
              <div className="text-xs text-muted">
                {new Date(p.paid_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="font-mono text-sm font-semibold text-ink">
              {formatRupees(p.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
