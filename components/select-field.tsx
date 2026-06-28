"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

// A fully custom dropdown — native <select> option lists are rendered by
// the OS/browser and can't be restyled, so they always look out of place
// against a custom dark theme. This renders its own list and mirrors the
// chosen value into a hidden input so it still posts with the form.
export function SelectField({
  name,
  options,
  defaultValue = "",
  placeholder = "Select",
  required,
  disabled,
  className,
}: {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-btn border border-field-border bg-field px-4 py-3.5 text-left text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-50"
      >
        <span className={`truncate ${selected ? "text-ink" : "text-faint"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-btn border border-field-border bg-card py-1.5 shadow-card">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  setValue(o.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm ${
                  o.value === value
                    ? "bg-accent-glow font-medium text-accent"
                    : "text-ink hover:bg-field"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
