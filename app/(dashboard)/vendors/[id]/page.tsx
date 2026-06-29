import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { formatRupees } from "@/lib/money";
import { colorForCategory, initialsFor } from "@/lib/vendor-category";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { can } from "@/lib/permissions";
import { SelectField } from "@/components/select-field";
import { PaymentChatParser } from "./payment-chat-parser";
import { recordPayment } from "./actions";
import { addVendorQuote, useVendorQuote, deleteVendorQuote } from "./quote-actions";
import { SubmitButton } from "@/components/submit-button";

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const wedding = await requireWedding();
  const viewMoney = can.viewMoney(wedding.role);
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

  const [{ data: payments }, { data: links }, { data: quotes }] = await Promise.all([
    viewMoney
      ? supabase
          .from("payments")
          .select("id, amount, mode, type, paid_at, notes")
          .eq("vendor_id", vendor.id)
          .order("paid_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; amount: number; mode: string; type: string; paid_at: string; notes: string | null }[] }),
    supabase
      .from("vendor_ceremony")
      .select("ceremonies(id, name)")
      .eq("vendor_id", vendor.id),
    viewMoney
      ? supabase
          .from("vendor_quotes")
          .select("id, amount, notes, created_at")
          .eq("vendor_id", vendor.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; amount: number; notes: string | null; created_at: string }[] }),
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
        <div className="flex-1 font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          Vendor
        </div>
        {viewMoney && (
          <Link href={`/vendors/${vendor.id}/edit`} className="text-sm font-medium text-accent">
            Edit
          </Link>
        )}
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

      {viewMoney && (
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
      )}

      {vendor.phone && (
        <div className="mb-[18px] flex gap-2.5">
          <a
            href={`tel:${vendor.phone.replace(/\s+/g, "")}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-btn border border-field-border bg-card px-4 py-3.5 text-sm font-semibold text-ink shadow-card"
          >
            <span className="text-lg">📞</span> Call
          </a>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-btn border border-field-border bg-card px-4 py-3.5 text-sm font-semibold text-ink shadow-card"
            >
              <span className="text-lg">💬</span> WhatsApp
            </a>
          )}
        </div>
      )}

      {viewMoney && (
        <>
          <div className="mb-2.5 text-[15px] font-semibold text-ink">Quotes</div>
          <div className="mb-[18px] flex flex-col gap-2.5">
            {(quotes ?? []).length === 0 && (
              <p className="text-sm text-muted">
                No quotes recorded yet — log every offer you get before booking.
              </p>
            )}
            {(quotes ?? []).map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold text-ink">
                    {formatRupees(q.amount)}
                    {q.amount === vendor.quoted_amount && (
                      <span className="ml-2 text-[11px] font-medium text-accent">selected</span>
                    )}
                  </div>
                  {q.notes && <div className="truncate text-xs text-muted">{q.notes}</div>}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {q.amount !== vendor.quoted_amount && (
                    <form action={useVendorQuote}>
                      <input type="hidden" name="vendorId" value={vendor.id} />
                      <input type="hidden" name="amount" value={q.amount} />
                      <button
                        type="submit"
                        className="rounded-btn border border-field-border bg-field px-3 py-2 text-xs font-semibold text-ink"
                      >
                        Use this
                      </button>
                    </form>
                  )}
                  <form action={deleteVendorQuote}>
                    <input type="hidden" name="quoteId" value={q.id} />
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <button type="submit" className="px-1 text-base text-faint">
                      ×
                    </button>
                  </form>
                </div>
              </div>
            ))}
            <form
              action={addVendorQuote}
              className="flex flex-col gap-2.5 rounded-card border border-field-border bg-card p-3.5 shadow-card"
            >
              <input type="hidden" name="vendorId" value={vendor.id} />
              <div className="flex items-center gap-2 rounded-btn border border-field-border bg-field px-3.5 py-2.5">
                <span className="font-mono text-sm text-muted">₹</span>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  required
                  placeholder="New quote"
                  className="w-full min-w-0 bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint"
                />
              </div>
              <div className="flex flex-col gap-2.5 min-[420px]:flex-row">
                <input
                  name="notes"
                  type="text"
                  placeholder="Notes"
                  className="min-w-0 flex-1 rounded-btn border border-field-border bg-field px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint"
                />
                <SubmitButton
                  pendingLabel="Adding…"
                  className="rounded-btn border border-field-border bg-field px-3.5 py-2.5 text-xs font-semibold text-ink"
                >
                  Add quote
                </SubmitButton>
              </div>
            </form>
          </div>

          <PaymentChatParser vendorId={vendor.id} />

          <div className="mb-2.5 text-[15px] font-semibold text-ink">Record a payment</div>
      <form
        action={recordPayment}
        className="mb-[18px] flex flex-col gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
      >
        <input type="hidden" name="vendorId" value={vendor.id} />

        <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-field px-4 py-3.5">
          <span className="font-mono text-base text-ink">₹</span>
          <span className="h-5 w-px bg-field-border" />
          <input
            name="amount"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            required
            placeholder="Amount"
            className="w-full bg-transparent font-mono text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex gap-2.5">
          <SelectField
            name="mode"
            required
            placeholder="Mode"
            className="flex-1"
            options={[
              { value: "cash", label: "Cash" },
              { value: "upi", label: "UPI" },
              { value: "bank", label: "Bank" },
            ]}
          />
          <SelectField
            name="type"
            required
            placeholder="Type"
            className="flex-1"
            options={[
              { value: "advance", label: "Advance" },
              { value: "balance", label: "Balance" },
            ]}
          />
        </div>

        <input
          name="notes"
          type="text"
          placeholder="Notes (optional)"
          className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <SubmitButton
          pendingLabel="Saving…"
          className="rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Save payment
        </SubmitButton>
      </form>

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
        </>
      )}
    </div>
  );
}
