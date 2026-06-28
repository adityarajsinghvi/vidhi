import type { SelectHTMLAttributes } from "react";

// Native <select> dressed up to match the app's field styling, with the
// browser's default arrow replaced by a custom chevron. Keeps native
// mobile picker UX (large OS-level wheel/sheet) — only the chrome changes.
export function SelectField({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <select
        {...props}
        className="w-full appearance-none rounded-btn border border-field-border bg-field px-4 py-3.5 pr-10 text-sm text-ink outline-none transition-colors focus:border-accent"
      >
        {children}
      </select>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
