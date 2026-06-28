"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const taskSchema = z.object({
  ceremonyId: z.string().uuid("Pick a ceremony"),
  description: z.string().trim().min(1, "Enter what needs to be done"),
  vendorId: z.string().uuid().optional(),
  dueAt: z.string().optional(),
});

export async function createTask(formData: FormData) {
  const parsed = taskSchema.safeParse({
    ceremonyId: formData.get("ceremonyId"),
    description: formData.get("description"),
    vendorId: formData.get("vendorId") || undefined,
    dueAt: formData.get("dueAt") || undefined,
  });

  if (!parsed.success) {
    redirect(`/tasks?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    ceremony_id: parsed.data.ceremonyId,
    vendor_id: parsed.data.vendorId || null,
    description: parsed.data.description,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
  });

  if (error) {
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function toggleTask(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const nextDone = formData.get("nextDone") === "true";

  const supabase = await createClient();
  await supabase.from("tasks").update({ done: nextDone }).eq("id", taskId);

  revalidatePath("/tasks");
}

export async function deleteTask(formData: FormData) {
  const taskId = String(formData.get("taskId"));

  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);

  revalidatePath("/tasks");
}
