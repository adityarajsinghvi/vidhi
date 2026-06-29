"use client";

import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { ROLE_LABEL } from "@/lib/permissions";
import type { Role } from "@/lib/weddings";
import { cancelInvite } from "./team-actions";

export function InviteRow({
  inviteId,
  phone,
  role,
}: {
  inviteId: string;
  phone: string;
  role: Role;
}) {
  const router = useRouter();

  async function onCancel() {
    const fd = new FormData();
    fd.set("inviteId", inviteId);
    await cancelInvite(fd);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2.5 rounded-btn border border-dashed border-field-border bg-field px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{formatPhone(phone)}</div>
        <div className="text-xs text-muted">Invited as {ROLE_LABEL[role]} · pending</div>
      </div>
      <button type="button" onClick={onCancel} className="text-xs font-medium text-red-500">
        Cancel
      </button>
    </div>
  );
}
