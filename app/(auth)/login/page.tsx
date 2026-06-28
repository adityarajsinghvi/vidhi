import { requestOtp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col justify-between gap-10 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-card shadow-[0_12px_30px_var(--color-accent-glow)]"
          style={{ background: "var(--color-accent)" }}
        >
          <span
            className="font-display text-3xl leading-none"
            style={{ color: "var(--color-accent-ink)" }}
          >
            व
          </span>
        </div>
        <h1 className="font-display text-4xl leading-none text-ink">Vidhi</h1>
        <p className="max-w-[260px] text-[15px] leading-snug text-muted">
          The quiet ledger behind every wedding. Track vendors, payments &amp;
          tasks — without leaving WhatsApp.
        </p>
      </div>

      <form action={requestOtp} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="pl-1 text-[13px] text-muted">
            Mobile number
          </label>
          <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-field px-4 py-3.5">
            <span className="font-mono text-base text-ink">+91</span>
            <span className="h-5 w-px bg-field-border" />
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              placeholder="98765 43210"
              className="w-full bg-transparent font-mono text-base tracking-wide text-ink outline-none placeholder:text-faint"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded-btn bg-accent px-4 py-4 text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Send OTP
        </button>
        <p className="mt-0.5 text-center text-xs text-faint">
          Phone OTP only — no passwords, no email.
        </p>
      </form>
    </div>
  );
}
