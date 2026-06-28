import { NotificationToggle } from "./notification-toggle";
import { ShareLink } from "./share-link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MorePage() {
  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 font-display text-[26px] leading-tight tracking-[0.01em] text-ink">
        More
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Appearance</div>
      <div className="mb-[22px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <ThemeToggle />
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Reminders</div>
      <div className="mb-[22px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <p className="mb-3 text-sm text-muted">
          Get a push notification when a scheduled vendor reminder is due.
        </p>
        <NotificationToggle />
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Share with the couple</div>
      <div className="mb-[22px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <p className="mb-3 text-sm text-muted">
          Anyone with this link can see ceremonies, vendors, and payment progress — no login
          needed. Don&apos;t share it outside the wedding party.
        </p>
        <ShareLink />
      </div>
    </div>
  );
}
