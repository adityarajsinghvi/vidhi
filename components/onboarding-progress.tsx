export function OnboardingProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-7 flex gap-1.5">
      <div className="h-1 flex-1 rounded-full bg-accent" />
      <div
        className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-accent" : "bg-field-border"}`}
      />
    </div>
  );
}
