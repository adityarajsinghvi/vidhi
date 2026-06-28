import { OnboardingProgress } from "@/components/onboarding-progress";
import { createWedding } from "./actions";

export default async function NewWeddingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <OnboardingProgress step={1} />
      <h1 className="mb-2 font-display text-[28px] leading-tight tracking-[0.01em] text-ink">
        Let&apos;s set up your
        <br />
        first wedding
      </h1>
      <p className="mb-7 text-sm leading-relaxed text-muted">
        Add the couple&apos;s names and budget — you can add ceremonies and
        vendors right after.
      </p>

      <form action={createWedding} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="coupleNames" className="pl-1 text-[13px] text-muted">
            Couple&apos;s names
          </label>
          <input
            id="coupleNames"
            name="coupleNames"
            type="text"
            required
            placeholder="Aanya & Vikram"
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="startDate" className="pl-1 text-[13px] text-muted">
              Starts
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
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
              className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
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
              placeholder="1850000"
              className="w-full bg-transparent font-mono text-base text-ink outline-none placeholder:text-faint"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="mt-2 rounded-btn bg-accent px-4 py-4 text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Create wedding
        </button>
      </form>
    </>
  );
}
