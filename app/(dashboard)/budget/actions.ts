"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Pick a category"),
  allocatedAmount: z.coerce.number().min(0, "Enter a valid amount"),
});

export async function setCategoryBudget(formData: FormData) {
  const wedding = await requireWedding();
  if (!can.viewMoney(wedding.role)) {
    redirect("/dashboard");
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    allocatedAmount: formData.get("allocatedAmount"),
  });

  if (!parsed.success) {
    redirect(`/budget?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_categories")
    .upsert(
      { wedding_id: wedding.id, name: parsed.data.name, allocated_amount: parsed.data.allocatedAmount },
      { onConflict: "wedding_id,name" },
    );

  if (error) {
    redirect(`/budget?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/budget");
  redirect("/budget");
}
