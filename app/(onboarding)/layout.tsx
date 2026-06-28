export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 justify-center">
      <div className="flex w-full max-w-sm flex-1 flex-col px-7 py-12">
        {children}
      </div>
    </div>
  );
}
