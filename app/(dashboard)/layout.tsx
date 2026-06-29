import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { BottomNav } from "@/components/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pick up any invites accepted while the user was already signed in.
  const supabase = await createClient();
  await supabase.rpc("resolve_my_invites");

  await requireWedding();

  return (
    <div className="relative flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
