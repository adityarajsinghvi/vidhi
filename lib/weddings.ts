import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Wedding = {
  id: string;
  owner_user_id: string;
  couple_names: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number;
  created_at: string;
};

export const ACTIVE_WEDDING_COOKIE = "vidhi_active_wedding";

// Guards every dashboard route: bounces signed-out users to /login and
// users with no wedding yet to onboarding, so pages can assume both exist.
// A planner can own multiple weddings; the active one is remembered via
// a cookie (set by switchWedding), falling back to the most recent.
export async function requireWedding(): Promise<Wedding> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (!weddings || weddings.length === 0) {
    redirect("/new-wedding");
  }

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_WEDDING_COOKIE)?.value;
  const active = activeId ? weddings.find((w) => w.id === activeId) : undefined;

  return active ?? weddings[0];
}

export async function listWeddings(): Promise<Wedding[]> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return weddings ?? [];
}
