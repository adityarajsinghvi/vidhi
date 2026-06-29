import { createClient } from "@/lib/supabase/server";
import { requireWedding, type Role } from "@/lib/weddings";
import { InviteForm } from "./invite-form";
import { MemberRow } from "./member-row";
import { InviteRow } from "./invite-row";

type MemberQueryRow = {
  user_id: string;
  role: Role;
  users: { name: string | null; phone: string | null } | { name: string | null; phone: string | null }[] | null;
};

// Owner-only. Lists current members + pending invites and lets the owner
// invite by phone, change roles, and remove people.
export async function TeamSection() {
  const active = await requireWedding();
  if (active.role !== "owner") return null;

  const supabase = await createClient();
  const [{ data: memberRows }, { data: invites }] = await Promise.all([
    supabase
      .from("wedding_members")
      .select("user_id, role, users(name, phone)")
      .eq("wedding_id", active.id),
    supabase.from("wedding_invites").select("id, phone, role").eq("wedding_id", active.id),
  ]);

  const roleRank: Record<Role, number> = { owner: 0, coordinator: 1, helper: 2 };
  const members = ((memberRows ?? []) as MemberQueryRow[])
    .map((m) => {
      const user = Array.isArray(m.users) ? m.users[0] : m.users;
      return { userId: m.user_id, role: m.role, name: user?.name ?? null, phone: user?.phone ?? null };
    })
    .sort((a, b) => roleRank[a.role] - roleRank[b.role]);

  return (
    <>
      <div className="mb-2.5 text-[15px] font-semibold text-ink">Team</div>
      <div className="mb-[22px] flex flex-col gap-2.5 rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <p className="text-sm text-muted">
          Invite people by phone number. They sign in with their own number — Coordinators can
          manage vendors, payments and tasks; Helpers see tasks and vendor contacts but no money.
        </p>

        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <MemberRow key={m.userId} {...m} />
          ))}
          {(invites ?? []).map((i) => (
            <InviteRow key={i.id} inviteId={i.id} phone={i.phone} role={i.role as Role} />
          ))}
        </div>

        <InviteForm />
      </div>
    </>
  );
}
