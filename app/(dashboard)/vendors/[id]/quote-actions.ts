"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const quoteSchema = z.object({
  vendorId: z.string().uuid(),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  notes: z.string().trim().optional(),
});

export async function addVendorQuote(formData: FormData) {
  const vendorId = String(formData.get("vendorId"));
  const parsed = quoteSchema.safeParse({
    vendorId,
    amount: formData.get("amount"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    redirect(`/vendors/${vendorId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vendor_quotes").insert({
    vendor_id: parsed.data.vendorId,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
  });

  if (error) {
    redirect(`/vendors/${vendorId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/vendors/${vendorId}`);
  redirect(`/vendors/${vendorId}`);
}

export async function useVendorQuote(formData: FormData) {
  const vendorId = String(formData.get("vendorId"));
  const amount = Number(formData.get("amount"));

  const supabase = await createClient();
  await supabase.from("vendors").update({ quoted_amount: amount }).eq("id", vendorId);

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
}

export async function deleteVendorQuote(formData: FormData) {
  const quoteId = String(formData.get("quoteId"));
  const vendorId = String(formData.get("vendorId"));

  const supabase = await createClient();
  await supabase.from("vendor_quotes").delete().eq("id", quoteId);

  revalidatePath(`/vendors/${vendorId}`);
}
