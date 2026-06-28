import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { updateCeremony } from "../actions";
import { DeleteCeremonyButton } from "./delete-ceremony-button";

export default async function EditCeremonyPage({
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
    .select("id, name, date, time, venue, notes")
    .eq("id", id)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (!ceremony) {
    notFound();
  }

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/dashboard" className="text-lg text-muted">
          ←
        </Link>
        <div className="font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          Edit ceremony
        </div>
      </div>

      <form action={updateCeremony} className="flex flex-col gap-4">
        <input type="hidden" name="ceremonyId" value={ceremony.id} />

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="pl-1 text-[13px] text-muted">
            Ceremony name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={ceremony.name}
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="date" className="pl-1 text-[13px] text-muted">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={ceremony.date ?? ""}
              className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="time" className="pl-1 text-[13px] text-muted">
              Time
            </label>
            <input
              id="time"
              name="time"
              type="time"
              defaultValue={ceremony.time ?? ""}
              className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="venue" className="pl-1 text-[13px] text-muted">
            Venue
          </label>
          <input
            id="venue"
            name="venue"
            type="text"
            defaultValue={ceremony.venue ?? ""}
            placeholder="e.g. The Leela, Gandhinagar"
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className="pl-1 text-[13px] text-muted">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={ceremony.notes ?? ""}
            placeholder="Anything worth remembering"
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="mt-2 rounded-btn bg-accent px-4 py-4 text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Save changes
        </button>
      </form>

      <DeleteCeremonyButton ceremonyId={ceremony.id} ceremonyName={ceremony.name} />
    </div>
  );
}
