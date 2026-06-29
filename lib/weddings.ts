import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export type Role = "owner" | "coordinator" | "helper";

export type Wedding = {
  id: string;
  owner_user_id: string;
  couple_names: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number;
  created_at: string;
};

export type ActiveWedding = Wedding & { role: Role };

export const ACTIVE_WEDDING_COOKIE = "vidhi_active_wedding";

type MembershipRow = { role: Role; weddings: Wedding | Wedding[] | null };

function flatten(rows: MembershipRow[] | null): ActiveWedding[] {
  return (rows ?? [])
    .map((row) => {
      const wedding = Array.isArray(row.weddings) ? row.weddings[0] : row.weddings;
      return wedding ? { ...wedding, role: row.role } : null;
    })
    .filter((w): w is ActiveWedding => w !== null)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// Both the dashboard layout and every page under it call requireWedding(), so
// without memoization each navigation paid for the membership query twice.
// React's cache() dedupes calls within a single request (it does NOT persist
// across requests/navigations) — same idea as listWeddings() below.
const getMemberships = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wedding_members")
    .select("role, weddings(*)")
    .eq("user_id", userId);
  return flatten(data as MembershipRow[] | null);
});

// Guards every dashboard route: bounces signed-out users to /login and users
// with no wedding membership to onboarding. A planner can own or be invited to
// multiple weddings; the active one is remembered via cookie, else most recent.
export async function requireWedding(): Promise<ActiveWedding> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const weddings = await getMemberships(user.id);
  if (weddings.length === 0) {
    redirect("/new-wedding");
  }

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_WEDDING_COOKIE)?.value;
  const active = activeId ? weddings.find((w) => w.id === activeId) : undefined;

  return active ?? weddings[0];
}

export async function listWeddings(): Promise<ActiveWedding[]> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return getMemberships(user.id);
}
