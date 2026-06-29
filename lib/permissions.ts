import type { Role } from "@/lib/weddings";

// Capability checks mirrored from the RLS policies in 0003_team_access.sql.
// RLS is the real security boundary; these exist so the UI can hide controls
// and server actions can fail fast with friendly messages instead of raw
// permission-denied errors. Keep the two in sync.
export const can = {
  viewMoney: (role: Role) => role === "owner" || role === "coordinator",
  manageVendors: (role: Role) => role === "owner" || role === "coordinator",
  manageCeremonies: (role: Role) => role === "owner" || role === "coordinator",
  manageReminders: (role: Role) => role === "owner" || role === "coordinator",
  manageTasks: (_role: Role) => true,
  manageTeam: (role: Role) => role === "owner",
  manageWedding: (role: Role) => role === "owner",
};

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  coordinator: "Coordinator",
  helper: "Helper",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  owner: "Full access, including team and billing",
  coordinator: "Manage vendors, payments, ceremonies & tasks",
  helper: "Tasks and vendor contacts — no payment details",
};
