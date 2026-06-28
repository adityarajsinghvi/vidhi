"use client";

import { useState } from "react";
import { SelectField } from "@/components/select-field";
import { recordPayment } from "./actions";

type ParsedPayment = {
  amount: number | null;
  mode: "cash" | "upi" | "bank" | null;
  confidence: "high" | "low";
};

export function PaymentChatParser({ vendorId }: { vendorId: string }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, vendorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not parse that message");
      setParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse that message");
    } finally {
      setLoading(false);
    }
  }

  function discard() {
    setParsed(null);
    setText("");
    setError(null);
  }

  return (
    <div className="mb-[18px] flex flex-col gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card">
      <div className="text-[15px] font-semibold text-ink">Paste a vendor message</div>

      {!parsed && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder='e.g. "10 hazaar mil gaye via UPI"'
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleParse}
            disabled={loading || !text.trim()}
            className="rounded-btn border border-field-border bg-field px-4 py-3 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {loading ? "Reading…" : "Parse message"}
          </button>
        </>
      )}

      {parsed && (
        <form
          action={recordPayment}
          className="flex flex-col gap-3 rounded-card border border-accent bg-field p-3.5"
        >
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="createdVia" value="chat_paste" />

          <div className="text-xs font-medium text-accent">
            {parsed.confidence === "high"
              ? "Looks clear — confirm the details before saving:"
              : "Not fully sure — please check before saving:"}
          </div>

          <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-card px-4 py-3.5">
            <span className="font-mono text-base text-ink">₹</span>
            <span className="h-5 w-px bg-field-border" />
            <input
              name="amount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              required
              defaultValue={parsed.amount ?? ""}
              placeholder="Amount"
              className="w-full bg-transparent font-mono text-base text-ink outline-none placeholder:text-faint"
            />
          </div>

          <div className="flex gap-2.5">
            <SelectField name="mode" required defaultValue={parsed.mode ?? ""} className="flex-1">
              <option value="" disabled>
                Mode
              </option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
            </SelectField>
            <SelectField name="type" required defaultValue="" className="flex-1">
              <option value="" disabled>
                Type
              </option>
              <option value="advance">Advance</option>
              <option value="balance">Balance</option>
            </SelectField>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={discard}
              className="flex-1 rounded-btn border border-field-border bg-card px-4 py-3.5 text-sm font-semibold text-muted"
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-1 rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
            >
              Confirm & save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
