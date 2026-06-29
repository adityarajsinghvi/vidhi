import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyOtp, resendOtp } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const cookieStore = await cookies();
  const phone = cookieStore.get("vidhi_pending_phone")?.value;
  if (!phone) redirect("/login");

  const { error, sent } = await searchParams;
  const masked = phone.replace(/^(\+91)(\d{2})\d{6}(\d{2})$/, "$1 $2•••• ••$3");

  return (
    <div className="flex flex-1 flex-col justify-between gap-10 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-3xl text-ink">Verify your number</h1>
        <p className="max-w-[260px] text-[15px] leading-snug text-muted">
          Enter the 6-digit code we sent to{" "}
          <span className="text-ink">{masked}</span>
        </p>
      </div>

      <form action={verifyOtp} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="code" className="pl-1 text-[13px] text-muted">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="••••••"
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-center font-mono text-lg tracking-[0.3em] text-ink outline-none placeholder:text-faint"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {sent && !error && <p className="text-sm text-muted">New code sent.</p>}
        <SubmitButton
          pendingLabel="Verifying…"
          className="rounded-btn bg-accent px-4 py-4 text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Verify &amp; continue
        </SubmitButton>
      </form>

      <form action={resendOtp} className="text-center">
        <SubmitButton
          pendingLabel="Resending…"
          className="text-xs text-faint underline-offset-2 hover:underline"
        >
          Didn&apos;t get a code? Resend
        </SubmitButton>
      </form>
    </div>
  );
}
