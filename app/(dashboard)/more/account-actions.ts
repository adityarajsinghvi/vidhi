"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WEDDING_COOKIE } from "@/lib/weddings";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Drop the active-wedding selection so the next person to sign in on this
  // device doesn't inherit it.
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_WEDDING_COOKIE);

  redirect("/login");
}
