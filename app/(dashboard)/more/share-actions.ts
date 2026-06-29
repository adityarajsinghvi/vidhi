"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShareToken } from "@/lib/share";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";

export async function getOrCreateShareToken(): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  const active = await requireWedding();
  if (!can.manageWedding(active.role)) {
    return { success: false, error: "Only the owner can create a share link" };
  }

  const supabase = await createClient();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, share_token")
    .eq("id", active.id)
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

export async function revokeShareToken(): Promise<
  { success: true } | { success: false; error: string }
> {
  const active = await requireWedding();
  if (!can.manageWedding(active.role)) {
    return { success: false, error: "Only the owner can revoke the share link" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("weddings")
    .update({ share_token: null })
    .eq("id", active.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
