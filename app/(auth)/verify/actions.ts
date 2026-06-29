"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function verifyOtp(formData: FormData) {
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  const cookieStore = await cookies();
  const phone = cookieStore.get("vidhi_pending_phone")?.value;

  if (!phone) {
    redirect("/login");
  }
  if (token.length !== 6) {
    redirect(
      `/verify?error=${encodeURIComponent("Enter the 6-digit code sent to your phone")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) {
    redirect(`/verify?error=${encodeURIComponent(error.message)}`);
  }

  cookieStore.delete("vidhi_pending_phone");

  // Convert any pending phone invites into memberships before deciding where
  // to send them — a freshly-invited helper owns no wedding but belongs to one.
  await supabase.rpc("resolve_my_invites");

  const { data: userData } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", userData.user?.id ?? "")
    .limit(1)
    .maybeSingle();

  redirect(membership ? "/dashboard" : "/new-wedding");
}

export async function resendOtp() {
  const cookieStore = await cookies();
  const phone = cookieStore.get("vidhi_pending_phone")?.value;
  if (!phone) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signInWithOtp({ phone });
  redirect("/verify?sent=1");
}
