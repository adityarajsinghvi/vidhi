"use client";

import { useEffect, useRef, useState } from "react";

// Sits first among a group of sibling checkboxes (matched by `name` within
// the same <form>) and toggles all of them at once.
export function SelectAllCheckboxes({ name }: { name: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [allChecked, setAllChecked] = useState(false);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const boxes = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"]`),
    );

    function sync() {
      setAllChecked(boxes.length > 0 && boxes.every((b) => b.checked));
    }
    sync();
    boxes.forEach((b) => b.addEventListener("change", sync));
    return () => boxes.forEach((b) => b.removeEventListener("change", sync));
  }, [name]);

  function toggleAll() {
    const form = ref.current?.closest("form");
    if (!form) return;
    const boxes = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"]`),
    );
    const next = !allChecked;
    boxes.forEach((b) => {
      b.checked = next;
      b.dispatchEvent(new Event("change", { bubbles: true }));
    });
    setAllChecked(next);
  }

  return (
    <label className="flex items-center gap-2 rounded-full border border-field-border bg-field px-3.5 py-2 text-sm font-medium text-accent">
      <input
        ref={ref}
        type="checkbox"
        checked={allChecked}
        onChange={toggleAll}
        className="accent-accent"
      />
      All
    </label>
  );
}
