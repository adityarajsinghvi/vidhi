"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function setTheme(dark: boolean) {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    setIsDark(dark);
  }

  if (isDark === null) return null;

  return (
    <div className="flex items-center gap-1 rounded-btn border border-field-border bg-field p-1 text-sm">
      <button
        onClick={() => setTheme(false)}
        className={`rounded-btn px-3 py-1.5 font-medium transition-colors ${
          !isDark ? "bg-accent text-accent-ink" : "text-muted"
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme(true)}
        className={`rounded-btn px-3 py-1.5 font-medium transition-colors ${
          isDark ? "bg-accent text-accent-ink" : "text-muted"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
