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

  const { data: userData } = await supabase.auth.getUser();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("owner_user_id", userData.user?.id ?? "")
    .limit(1)
    .maybeSingle();

  redirect(wedding ? "/dashboard" : "/new-wedding");
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
