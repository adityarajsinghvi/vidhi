"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WEDDING_COOKIE } from "@/lib/weddings";

export async function switchWedding(formData: FormData) {
  const weddingId = String(formData.get("weddingId"));

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  // Re-verify membership server-side rather than trusting the posted id.
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("wedding_id", weddingId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/more");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WEDDING_COOKIE, membership.wedding_id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect("/dashboard");
}
