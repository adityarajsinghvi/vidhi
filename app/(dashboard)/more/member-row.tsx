"use client";

import { useRouter } from "next/navigation";
import { SelectField } from "@/components/select-field";
import { formatPhone } from "@/lib/phone";
import type { Role } from "@/lib/weddings";
import { changeMemberRole, removeMember } from "./team-actions";

export function MemberRow({
  userId,
  role,
  name,
  phone,
}: {
  userId: string;
  role: Role;
  name: string | null;
  phone: string | null;
}) {
  const router = useRouter();
  const display = name || formatPhone(phone) || "Member";

  async function onRoleChange(next: string) {
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", next);
    await changeMemberRole(fd);
    router.refresh();
  }

  async function onRemove() {
    if (!confirm(`Remove ${display} from this wedding?`)) return;
    const fd = new FormData();
    fd.set("userId", userId);
    await removeMember(fd);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-field px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{display}</div>
        {name && phone && <div className="truncate text-xs text-muted">{formatPhone(phone)}</div>}
      </div>

      {role === "owner" ? (
        <span className="text-xs font-medium text-accent">Owner</span>
      ) : (
        <>
          <SelectField
            name="role"
            defaultValue={role}
            className="w-[130px]"
            options={[
              { value: "coordinator", label: "Coordinator" },
              { value: "helper", label: "Helper" },
            ]}
            onValueChange={onRoleChange}
          />
          <button type="button" onClick={onRemove} className="px-1 text-base text-faint">
            ×
          </button>
        </>
      )}
    </div>
  );
}
