"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("weddings").insert({
    owner_user_id: userId,
    couple_names: coupleNames,
    start_date: startDate || null,
    end_date: endDate || null,
    budget_total: budgetTotal ? Number(budgetTotal) : 0,
  });

  if (error) {
    redirect(`/new-wedding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/add-to-home-screen");
}
