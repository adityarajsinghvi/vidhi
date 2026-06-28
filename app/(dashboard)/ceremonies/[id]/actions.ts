"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ceremonyEditSchema = z.object({
  ceremonyId: z.string().uuid(),
  name: z.string().trim().min(1, "Enter a ceremony name"),
  date: z.string().optional(),
  time: z.string().optional(),
  venue: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateCeremony(formData: FormData) {
  const ceremonyId = String(formData.get("ceremonyId"));
  const parsed = ceremonyEditSchema.safeParse({
    ceremonyId,
    name: formData.get("name"),
    date: formData.get("date") || undefined,
    time: formData.get("time") || undefined,
    venue: formData.get("venue") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/ceremonies/${ceremonyId}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ceremonies")
    .update({
      name: parsed.data.name,
      date: parsed.data.date || null,
      time: parsed.data.time || null,
      venue: parsed.data.venue || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.ceremonyId);

  if (error) {
    redirect(`/ceremonies/${ceremonyId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  redirect("/dashboard");
}

export async function deleteCeremony(formData: FormData) {
  const ceremonyId = String(formData.get("ceremonyId"));
  const supabase = await createClient();

  const { error } = await supabase.from("ceremonies").delete().eq("id", ceremonyId);
  if (error) {
    redirect(`/ceremonies/${ceremonyId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  redirect("/dashboard");
}
