import { NotificationToggle } from "./notification-toggle";

export default function MorePage() {
  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 font-display text-[26px] leading-tight tracking-[0.01em] text-ink">
        More
      </div>

      <div className="mb-2.5 text-[15px] font-semibold text-ink">Reminders</div>
      <div className="mb-[22px] rounded-card border border-field-border bg-card p-3.5 shadow-card">
        <p className="mb-3 text-sm text-muted">
          Get a push notification when a scheduled vendor reminder is due.
        </p>
        <NotificationToggle />
      </div>

      <p className="text-center text-sm text-muted">
        Dark mode and sharing options will live here too.
      </p>
    </div>
  );
}
