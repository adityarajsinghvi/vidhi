import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { createContact } from "./actions";
import { DeleteContactButton } from "./delete-contact-button";
import { SubmitButton } from "@/components/submit-button";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const wedding = await requireWedding();
  const manage = can.manageVendors(wedding.role);
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, relation, phone, notes")
    .eq("wedding_id", wedding.id)
    .order("name", { ascending: true });

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/more" className="text-lg text-muted">
          ←
        </Link>
        <div className="font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          Contacts
        </div>
      </div>

      <p className="mb-[18px] text-sm text-muted">
        Everyone on the team can see and call these — vendors, family decision-makers, venue
        managers, whoever the team needs to reach.
      </p>

      {manage && (
        <form
          action={createContact}
          className="mb-[22px] flex flex-col gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
        >
          <input
            name="name"
            type="text"
            required
            placeholder="Name"
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
          <div className="flex flex-col gap-2.5 min-[420px]:flex-row">
            <input
              name="relation"
              type="text"
              placeholder="e.g. Dulha's mama"
              className="min-w-0 flex-1 rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none placeholder:text-faint"
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone"
              className="min-w-0 flex-1 rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none placeholder:text-faint"
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
            pendingLabel="Adding…"
            className="rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
          >
            Add contact
          </SubmitButton>
        </form>
      )}

      <div className="flex flex-col gap-2.5">
        {(contacts ?? []).length === 0 && (
          <p className="text-sm text-muted">No contacts yet.</p>
        )}
        {(contacts ?? []).map((c) => {
          const waLink = c.phone ? buildWhatsAppLink(c.phone, `Hi ${c.name},`) : null;
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">{c.name}</div>
                <div className="text-xs text-muted">
                  {c.relation}
                  {c.relation && c.phone && " · "}
                  {c.phone}
                </div>
                {c.notes && <div className="mt-0.5 text-xs text-faint">{c.notes}</div>}
              </div>
              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/\s+/g, "")}`}
                  className="flex-shrink-0 text-lg"
                  title="Call"
                >
                  📞
                </a>
              )}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-lg"
                  title="Message on WhatsApp"
                >
                  💬
                </a>
              )}
              {manage && <DeleteContactButton contactId={c.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
