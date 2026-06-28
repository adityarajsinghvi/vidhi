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
});

export async function recordPayment(formData: FormData) {
  const vendorId = String(formData.get("vendorId"));
  const parsed = paymentSchema.safeParse({
    vendorId,
    amount: formData.get("amount"),
    mode: formData.get("mode"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
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
  });

  if (error) {
    redirect(`/vendors/${vendorId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect(`/vendors/${vendorId}`);
}
