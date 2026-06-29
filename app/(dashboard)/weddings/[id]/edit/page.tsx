import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateWedding } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { DeleteWeddingButton } from "./delete-wedding-button";

export default async function EditWeddingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, couple_names, start_date, end_date, budget_total")
    .eq("id", id)
    .eq("owner_user_id", userData.user?.id ?? "")
    .maybeSingle();

  if (!wedding) {
    notFound();
  }

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/more" className="text-lg text-muted">
          ←
        </Link>
        <div className="font-display text-[22px] leading-tight tracking-[0.01em] text-ink">
          Edit wedding
        </div>
      </div>

      <form action={updateWedding} className="flex flex-col gap-4">
        <input type="hidden" name="weddingId" value={wedding.id} />

        <div className="flex flex-col gap-2">
          <label htmlFor="coupleNames" className="pl-1 text-[13px] text-muted">
            Couple&apos;s names
          </label>
          <input
            id="coupleNames"
            name="coupleNames"
            type="text"
            required
            defaultValue={wedding.couple_names}
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex flex-col gap-3 min-[420px]:flex-row">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="startDate" className="pl-1 text-[13px] text-muted">
              Starts
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={wedding.start_date ?? ""}
              className="w-full min-w-0 rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="endDate" className="pl-1 text-[13px] text-muted">
              Ends
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={wedding.end_date ?? ""}
              className="w-full min-w-0 rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="budgetTotal" className="pl-1 text-[13px] text-muted">
            Total budget
          </label>
          <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-field px-4 py-3.5">
            <span className="font-mono text-base text-ink">₹</span>
            <span className="h-5 w-px bg-field-border" />
            <input
              id="budgetTotal"
              name="budgetTotal"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={wedding.budget_total}
              className="w-full bg-transparent font-mono text-base text-ink outline-none placeholder:text-faint"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <SubmitButton
          pendingLabel="Saving…"
          className="mt-2 rounded-btn bg-accent px-4 py-4 text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Save changes
        </SubmitButton>
      </form>

      <DeleteWeddingButton weddingId={wedding.id} coupleNames={wedding.couple_names} />
    </div>
  );
}
