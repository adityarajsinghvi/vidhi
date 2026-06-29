import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can, ROLE_LABEL } from "@/lib/permissions";
import { formatPhone } from "@/lib/phone";
import { NotificationToggle } from "./notification-toggle";
import { ShareLink } from "./share-link";
import { RemindersList } from "./reminders-list";
import { WeddingSwitcher } from "./wedding-switcher";
import { TeamSection } from "./team-section";
import { signOut } from "./account-actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function MorePage() {
  const active = await requireWedding();
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-1 font-display text-[26px] leading-tight tracking-[0.01em] text-ink">
        More
      </div>
      <div className="mb-5 text-[13px] text-muted">
        You&apos;re the <span className="font-medium text-accent">{ROLE_LABEL[active.role]}</span> on{" "}
        {active.couple_names}
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Weddings</div>
      <div className="mb-[22px]">
        <WeddingSwitcher />
      </div>

      <TeamSection />

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Appearance</div>
      <div className="mb-[22px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <ThemeToggle />
      </div>

      {can.manageReminders(active.role) && (
        <>
          <div className="mb-2.5 text-[15px] font-semibold text-ink">Reminders</div>
          <div className="mb-[22px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
            <p className="mb-3 text-sm text-muted">
              Get a push notification when a scheduled vendor reminder is due.
            </p>
            <NotificationToggle />
          </div>

          <div className="mb-2.5 text-[15px] font-semibold text-ink">Scheduled reminders</div>
          <div className="mb-[22px]">
            <RemindersList />
          </div>
        </>
      )}

      {can.manageWedding(active.role) && (
        <>
          <div className="mb-2.5 text-[15px] font-semibold text-ink">Share with the couple</div>
          <div className="mb-[22px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
            <p className="mb-3 text-sm text-muted">
              Anyone with this link can see ceremonies, vendors, and payment progress — no login
              needed. Don&apos;t share it outside the wedding party.
            </p>
            <ShareLink />
          </div>
        </>
      )}

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Account</div>
      <div className="mb-[22px] flex items-center justify-between gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">Signed in</div>
          {userData.user?.phone && (
            <div className="truncate text-xs text-muted">{formatPhone(userData.user.phone)}</div>
          )}
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm font-semibold text-red-500">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
