"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VoiceRecorder } from "@/app/(dashboard)/voice-recorder";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-start gap-0 border-t border-field-border bg-nav px-4 pt-2.5 backdrop-blur-xl">
      <NavTab href="/dashboard" label="Home" icon="▦" active={pathname === "/dashboard"} />
      <NavTab href="/vendors" label="Vendors" icon="☷" active={pathname.startsWith("/vendors")} />
      <div className="flex flex-1 justify-center">
        <VoiceRecorder />
      </div>
      <NavTab href="/tasks" label="Tasks" icon="✓" active={pathname.startsWith("/tasks")} />
      <NavTab href="/more" label="More" icon="⋯" active={pathname.startsWith("/more")} />
    </div>
  );
}

function NavTab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-0.5 pb-2.5"
      style={{ color: active ? "var(--color-accent)" : "var(--color-faint)" }}
    >
      <span className="text-[19px]">{icon}</span>
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}
