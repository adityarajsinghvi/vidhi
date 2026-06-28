"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const paymentSchema = z.object({
  vendorId: z.string().uuid(),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  mode: z.enum(["cash", "upi", "bank"], { message: "Pick a payment mode" }),
  type: z.enum(["advance", "balance"], { message: "Pick a payment type" }),
  notes: z.string().optional(),
  createdVia: z.enum(["manual", "voice", "chat_paste"]).default("manual"),
});

export async function recordPayment(formData: FormData) {
  const vendorId = String(formData.get("vendorId"));
  const parsed = paymentSchema.safeParse({
    vendorId,
    amount: formData.get("amount"),
    mode: formData.get("mode"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
    createdVia: formData.get("createdVia") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/vendors/${vendorId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    vendor_id: parsed.data.vendorId,
    amount: parsed.data.amount,
    mode: parsed.data.mode,
    type: parsed.data.type,
    notes: parsed.data.notes || null,
    created_via: parsed.data.createdVia,
  });

  if (error) {
    redirect(`/vendors/${vendorId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect(`/vendors/${vendorId}`);
}

const vendorEditSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().trim().min(1, "Enter the vendor's name"),
  category: z.string().trim().min(1, "Pick a category"),
  phone: z.string().optional(),
  quotedAmount: z.string().optional(),
});

export async function updateVendor(formData: FormData) {
  const vendorId = String(formData.get("vendorId"));
  const parsed = vendorEditSchema.safeParse({
    vendorId,
    name: formData.get("name"),
    category: formData.get("category"),
    phone: formData.get("phone") || undefined,
    quotedAmount: formData.get("quotedAmount") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/vendors/${vendorId}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const ceremonyIds = formData.getAll("ceremonyIds").map(String);
  const supabase = await createClient();

  const { error } = await supabase
    .from("vendors")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      phone: parsed.data.phone || null,
      quoted_amount: parsed.data.quotedAmount ? Number(parsed.data.quotedAmount) : 0,
    })
    .eq("id", parsed.data.vendorId);

  if (error) {
    redirect(`/vendors/${vendorId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("vendor_ceremony").delete().eq("vendor_id", parsed.data.vendorId);
  if (ceremonyIds.length > 0) {
    await supabase
      .from("vendor_ceremony")
      .insert(ceremonyIds.map((ceremonyId) => ({ vendor_id: parsed.data.vendorId, ceremony_id: ceremonyId })));
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect(`/vendors/${vendorId}`);
}

export async function deleteVendor(formData: FormData) {
  const vendorId = String(formData.get("vendorId"));
  const supabase = await createClient();

  const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
  if (error) {
    redirect(`/vendors/${vendorId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect("/vendors");
}
