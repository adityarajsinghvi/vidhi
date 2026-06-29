"use client";

import { useState } from "react";
import { SelectField } from "@/components/select-field";
import { SubmitButton } from "@/components/submit-button";
import { setCategoryBudget } from "./actions";

export function BudgetAllocationForm({
  rows,
}: {
  rows: { name: string; allocated: number }[];
}) {
  const [category, setCategory] = useState("");
  const selected = rows.find((r) => r.name === category);

  return (
    <form
      action={setCategoryBudget}
      className="flex flex-col gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
    >
      <SelectField
        name="name"
        required
        placeholder="Choose a category"
        options={rows.map((r) => ({ value: r.name, label: r.name }))}
        onValueChange={setCategory}
      />
      <div className="flex items-center gap-2 rounded-btn border border-field-border bg-field px-3.5 py-2.5">
        <span className="font-mono text-sm text-muted">₹</span>
        <input
          key={category}
          name="allocatedAmount"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          defaultValue={selected?.allocated || ""}
          placeholder="Allocate amount"
          className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
      <SubmitButton
        pendingLabel="Saving…"
        className="rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
      >
        Save
      </SubmitButton>
    </form>
  );
}
