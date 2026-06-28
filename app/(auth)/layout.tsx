export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          background:
            "radial-gradient(120% 55% at 50% -8%, var(--color-accent-glow), transparent 62%)",
        }}
      />
      <div className="relative z-10 flex flex-1 justify-center">
        <div className="flex w-full max-w-sm flex-1 flex-col px-7 py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
