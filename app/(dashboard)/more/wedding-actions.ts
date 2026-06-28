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

  // Re-verify ownership server-side rather than trusting the posted id.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("id", weddingId)
    .eq("owner_user_id", userData.user.id)
    .maybeSingle();

  if (!wedding) {
    redirect("/more");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WEDDING_COOKIE, wedding.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect("/dashboard");
}
