import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding-progress";

export default function AddToHomeScreenPage() {
  return (
    <>
      <OnboardingProgress step={2} />
      <h1 className="mb-2 font-display text-[28px] leading-tight tracking-[0.01em] text-ink">
        Add Vidhi to your
        <br />
        Home Screen
      </h1>
      <p className="mb-7 text-sm leading-relaxed text-muted">
        Reminders only reach your lock screen once Vidhi lives on your home
        screen. Takes 10 seconds.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-btn border border-field-border bg-field px-4 py-3.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-accent-glow text-lg text-accent">
            ⤴
          </div>
          <div className="text-sm text-ink">
            Tap the <b>Share</b> icon in Safari
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-btn border border-field-border bg-field px-4 py-3.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-accent-glow text-lg text-accent">
            ＋
          </div>
          <div className="text-sm text-ink">
            Choose <b>Add to Home Screen</b>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-btn border border-field-border bg-field px-4 py-3.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-accent text-accent-ink">
            <span className="font-display text-lg">व</span>
          </div>
          <div className="text-sm text-ink">Open Vidhi from your home screen</div>
        </div>
      </div>

      <div className="flex-1" />

      <Link
        href="/dashboard"
        className="rounded-btn bg-accent px-4 py-4 text-center text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
      >
        I&apos;ve added it — continue
      </Link>
      <Link
        href="/dashboard"
        className="px-3 py-3 text-center text-[13px] text-faint"
      >
        Skip for now
      </Link>
    </>
  );
}
