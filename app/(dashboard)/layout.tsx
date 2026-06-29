import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

const INVITES_CHECKED_COOKIE = "vidhi_invites_checked";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every page under here already calls requireWedding() itself, which
  // redirects appropriately — no need to duplicate that guard here.
  //
  // Pick up any invites accepted while the user was already signed in, but
  // only once every few minutes (not on every single navigation) — this RPC
  // is a write and was previously firing on every tab switch.
  const cookieStore = await cookies();
  if (!cookieStore.get(INVITES_CHECKED_COOKIE)) {
    const supabase = await createClient();
    await supabase.rpc("resolve_my_invites");
    try {
      // Layouts can't write cookies during render in all cases (e.g. when
      // served from a cache); harmless to skip — worst case we just re-check
      // next time instead of waiting out the full 5 minutes.
      cookieStore.set(INVITES_CHECKED_COOKIE, "1", { maxAge: 300, path: "/" });
    } catch {}
  }

  return (
    <div className="relative flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
