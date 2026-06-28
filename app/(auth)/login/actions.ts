"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number");

export async function requestOtp(formData: FormData) {
  const raw = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const parsed = phoneSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const phone = `+91${parsed.data}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("vidhi_pending_phone", phone, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  redirect("/verify");
}
