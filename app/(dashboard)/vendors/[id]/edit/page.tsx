import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";
import { VENDOR_CATEGORIES } from "@/lib/vendor-category";
import { SelectField } from "@/components/select-field";
import { DeleteVendorButton } from "./delete-vendor-button";
import { updateVendor } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { SelectAllCheckboxes } from "@/components/select-all-checkboxes";

export default async function EditVendorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const wedding = await requireWedding();
  if (!can.manageVendors(wedding.role)) {
    redirect("/vendors");
  }
  const supabase = await createClient();

  const [{ data: vendor }, { data: ceremonies }, { data: links }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name, category, phone, quoted_amount, balance_due_at")
      .eq("id", id)
      .eq("wedding_id", wedding.id)
      .maybeSingle(),
    supabase
      .from("ceremonies")
      .select("id, name")
      .eq("wedding_id", wedding.id)
      .order("date", { ascending: true }),
    supabase.from("vendor_ceremony").select("ceremony_id").eq("vendor_id", id),
  ]);

  if (!vendor) {
    notFound();
  }

  const linkedCeremonyIds = new Set((links ?? []).map((l) => l.ceremony_id));

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/vendors/${vendor.id}`} className="text-lg text-muted">
          ←
        </Link>
        <div className="font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          Edit vendor
        </div>
      </div>

      <form action={updateVendor} className="flex flex-col gap-4">
        <input type="hidden" name="vendorId" value={vendor.id} />
        <input type="hidden" name="weddingId" value={wedding.id} />

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="pl-1 text-[13px] text-muted">
            Vendor name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={vendor.name}
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="pl-1 text-[13px] text-muted">Category</label>
          <SelectField
            name="category"
            required
            defaultValue={vendor.category}
            options={VENDOR_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="pl-1 text-[13px] text-muted">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={vendor.phone ?? ""}
            placeholder="98765 43210"
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quotedAmount" className="pl-1 text-[13px] text-muted">
            Quoted amount
          </label>
          <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-field px-4 py-3.5">
            <span className="font-mono text-base text-ink">₹</span>
            <span className="h-5 w-px bg-field-border" />
            <input
              id="quotedAmount"
              name="quotedAmount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={vendor.quoted_amount}
              className="w-full bg-transparent font-mono text-base text-ink outline-none placeholder:text-faint"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="balanceDueAt" className="pl-1 text-[13px] text-muted">
            Balance due date
          </label>
          <input
            id="balanceDueAt"
            name="balanceDueAt"
            type="date"
            defaultValue={vendor.balance_due_at ? vendor.balance_due_at.slice(0, 10) : ""}
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
          />
          <p className="pl-1 text-xs text-faint">
            We&apos;ll auto-schedule a reminder the day before, while a balance remains.
          </p>
        </div>

        {(ceremonies ?? []).length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="pl-1 text-[13px] text-muted">Ceremonies</span>
            <div className="flex flex-wrap gap-2">
              <SelectAllCheckboxes name="ceremonyIds" />
              {(ceremonies ?? []).map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-full border border-field-border bg-field px-3.5 py-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    name="ceremonyIds"
                    value={c.id}
                    defaultChecked={linkedCeremonyIds.has(c.id)}
                    className="accent-accent"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <SubmitButton
          pendingLabel="Saving…"
          className="mt-2 rounded-btn bg-accent px-4 py-4 text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Save changes
        </SubmitButton>
      </form>

      <DeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
    </div>
  );
}
