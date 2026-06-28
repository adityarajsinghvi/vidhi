"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { VENDOR_CATEGORIES } from "@/lib/vendor-category";

const vendorSchema = z.object({
  name: z.string().trim().min(1, "Enter the vendor's name"),
  category: z.enum(VENDOR_CATEGORIES, { message: "Pick a category" }),
  phone: z.string().optional(),
  quotedAmount: z.string().optional(),
});

export async function createVendor(formData: FormData) {
  const parsed = vendorSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    phone: formData.get("phone") || undefined,
    quotedAmount: formData.get("quotedAmount") || undefined,
  });

  if (!parsed.success) {
    redirect(`/vendors/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const wedding = await requireWedding();
  const supabase = await createClient();
  const ceremonyIds = formData.getAll("ceremonyIds").map(String);

  const { name, category, phone, quotedAmount } = parsed.data;

  const { data: vendor, error } = await supabase
    .from("vendors")
    .insert({
      wedding_id: wedding.id,
      name,
      category,
      phone: phone || null,
      quoted_amount: quotedAmount ? Number(quotedAmount) : 0,
    })
    .select("id")
    .single();

  if (error || !vendor) {
    redirect(`/vendors/new?error=${encodeURIComponent(error?.message ?? "Could not save vendor")}`);
  }

  if (ceremonyIds.length > 0) {
    await supabase
      .from("vendor_ceremony")
      .insert(ceremonyIds.map((ceremonyId) => ({ vendor_id: vendor.id, ceremony_id: ceremonyId })));
  }

  redirect(`/vendors/${vendor.id}`);
}
