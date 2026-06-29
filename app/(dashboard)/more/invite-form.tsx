"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectField } from "@/components/select-field";
import { inviteMember } from "./team-actions";

export function InviteForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("helper");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("phone", phone);
      fd.set("role", role);
      const result = await inviteMember(fd);
      if (!result.success) throw new Error(result.error);
      setPhone("");
      setRole("helper");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the invite");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-field-border pt-3">
      <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-field px-4 py-3">
        <span className="text-sm text-muted">+91</span>
        <span className="h-5 w-px bg-field-border" />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="numeric"
          placeholder="10-digit number"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
      <div className="flex gap-2.5">
        <SelectField
          name="role"
          defaultValue="helper"
          className="flex-1"
          options={[
            { value: "coordinator", label: "Coordinator" },
            { value: "helper", label: "Helper" },
          ]}
          onValueChange={setRole}
        />
        <button
          type="button"
          onClick={submit}
          disabled={saving || phone.replace(/\D/g, "").length !== 10}
          className="rounded-btn bg-accent px-5 py-3 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)] disabled:opacity-50"
        >
          {saving ? "Inviting…" : "Invite"}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
