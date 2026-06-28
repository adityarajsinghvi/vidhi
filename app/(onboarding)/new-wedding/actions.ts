"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WEDDING_COOKIE } from "@/lib/weddings";

const weddingSchema = z.object({
  coupleNames: z.string().trim().min(1, "Enter the couple's names"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetTotal: z.string().optional(),
});

export async function createWedding(formData: FormData) {
  const parsed = weddingSchema.safeParse({
    coupleNames: formData.get("coupleNames"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    budgetTotal: formData.get("budgetTotal") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/new-wedding?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const { coupleNames, startDate, endDate, budgetTotal } = parsed.data;

  const { count: existingCount } = await supabase
    .from("weddings")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", userId);

  const { data: wedding, error } = await supabase
    .from("weddings")
    .insert({
      owner_user_id: userId,
      couple_names: coupleNames,
      start_date: startDate || null,
      end_date: endDate || null,
      budget_total: budgetTotal ? Number(budgetTotal) : 0,
    })
    .select("id")
    .single();

  if (error || !wedding) {
    redirect(`/new-wedding?error=${encodeURIComponent(error?.message ?? "Could not save wedding")}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WEDDING_COOKIE, wedding.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  const isFirstWedding = !existingCount || existingCount === 0;
  redirect(isFirstWedding ? "/add-to-home-screen" : "/dashboard");
}
