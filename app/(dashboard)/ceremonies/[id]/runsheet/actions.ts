"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const itemSchema = z.object({
  ceremonyId: z.string().uuid(),
  time: z.string().optional(),
  title: z.string().trim().min(1, "Enter what happens"),
  notes: z.string().trim().optional(),
});

export async function createRunSheetItem(formData: FormData) {
  const ceremonyId = String(formData.get("ceremonyId"));
  const parsed = itemSchema.safeParse({
    ceremonyId,
    time: formData.get("time") || undefined,
    title: formData.get("title"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/ceremonies/${ceremonyId}/runsheet?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("run_sheet_items")
    .select("id", { count: "exact", head: true })
    .eq("ceremony_id", parsed.data.ceremonyId);

  const { error } = await supabase.from("run_sheet_items").insert({
    ceremony_id: parsed.data.ceremonyId,
    time: parsed.data.time || null,
    title: parsed.data.title,
    notes: parsed.data.notes || null,
    sort_order: count ?? 0,
  });

  if (error) {
    redirect(`/ceremonies/${ceremonyId}/runsheet?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/ceremonies/${ceremonyId}/runsheet`);
  redirect(`/ceremonies/${ceremonyId}/runsheet`);
}

export async function toggleRunSheetItem(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const ceremonyId = String(formData.get("ceremonyId"));
  const nextDone = formData.get("nextDone") === "true";

  const supabase = await createClient();
  await supabase.from("run_sheet_items").update({ done: nextDone }).eq("id", itemId);

  revalidatePath(`/ceremonies/${ceremonyId}/runsheet`);
}

export async function deleteRunSheetItem(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const ceremonyId = String(formData.get("ceremonyId"));

  const supabase = await createClient();
  await supabase.from("run_sheet_items").delete().eq("id", itemId);

  revalidatePath(`/ceremonies/${ceremonyId}/runsheet`);
}
