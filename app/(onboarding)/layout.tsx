export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 justify-center">
      <div className="flex w-full max-w-sm flex-1 flex-col px-6 py-8 sm:px-7 sm:py-12">
        {children}
      </div>
    </div>
  );
}
