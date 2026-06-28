"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShareToken } from "@/lib/share";

export async function getOrCreateShareToken(): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: "Not signed in" };
  }

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, share_token")
    .eq("owner_user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!wedding) {
    return { success: false, error: "No wedding found" };
  }

  if (wedding.share_token) {
    return { success: true, token: wedding.share_token };
  }

  const token = generateShareToken();
  const { error } = await supabase
    .from("weddings")
    .update({ share_token: token })
    .eq("id", wedding.id);

  if (error) return { success: false, error: error.message };
  return { success: true, token };
}
