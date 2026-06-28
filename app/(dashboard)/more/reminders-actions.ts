"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelReminder(formData: FormData) {
  const reminderId = String(formData.get("reminderId"));

  const supabase = await createClient();
  await supabase.from("reminders").delete().eq("id", reminderId);

  revalidatePath("/more");
}
