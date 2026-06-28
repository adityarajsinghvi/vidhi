"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const weddingEditSchema = z.object({
  weddingId: z.string().uuid(),
  coupleNames: z.string().trim().min(1, "Enter the couple's names"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetTotal: z.string().optional(),
});

export async function updateWedding(formData: FormData) {
  const weddingId = String(formData.get("weddingId"));
  const parsed = weddingEditSchema.safeParse({
    weddingId,
    coupleNames: formData.get("coupleNames"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    budgetTotal: formData.get("budgetTotal") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/weddings/${weddingId}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("weddings")
    .update({
      couple_names: parsed.data.coupleNames,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      budget_total: parsed.data.budgetTotal ? Number(parsed.data.budgetTotal) : 0,
    })
    .eq("id", parsed.data.weddingId);

  if (error) {
    redirect(`/weddings/${weddingId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/more");
  redirect("/dashboard");
}

export async function deleteWedding(formData: FormData) {
  const weddingId = String(formData.get("weddingId"));
  const supabase = await createClient();

  const { error } = await supabase.from("weddings").delete().eq("id", weddingId);
  if (error) {
    redirect(`/weddings/${weddingId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/more");
  redirect("/dashboard");
}
