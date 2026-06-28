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

// Guards every dashboard route: bounces signed-out users to /login and
// users with no wedding yet to onboarding, so pages can assume both exist.
export async function requireWedding(): Promise<Wedding> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!wedding) {
    redirect("/new-wedding");
  }

  return wedding;
}
