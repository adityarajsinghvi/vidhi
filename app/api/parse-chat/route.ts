import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePaymentMessage } from "@/lib/gemini";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = body?.text;
  const vendorId = body?.vendorId;

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }
  if (typeof vendorId !== "string") {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  // RLS scopes this to vendors the signed-in planner actually owns.
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendorId)
    .maybeSingle();

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  try {
    const parsed = await parsePaymentMessage(text);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse message" },
      { status: 500 },
    );
  }
}
