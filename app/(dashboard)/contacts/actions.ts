"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  relation: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createContact(formData: FormData) {
  const wedding = await requireWedding();
  if (!can.manageVendors(wedding.role)) {
    redirect("/contacts");
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    relation: formData.get("relation") || undefined,
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    redirect(`/contacts?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    wedding_id: wedding.id,
    name: parsed.data.name,
    relation: parsed.data.relation || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    redirect(`/contacts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function deleteContact(formData: FormData) {
  const wedding = await requireWedding();
  if (!can.manageVendors(wedding.role)) {
    redirect("/contacts");
  }

  const contactId = String(formData.get("contactId"));
  const supabase = await createClient();
  await supabase.from("contacts").delete().eq("id", contactId).eq("wedding_id", wedding.id);

  revalidatePath("/contacts");
}
