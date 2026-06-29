"use client";

import { useFormStatus } from "react-dom";

// Drop this inside any <form action={...}> instead of a plain <button
// type="submit">. While the action is in flight it disables itself and
// swaps in a spinner, so a slow network can't be mistaken for "nothing
// happened" and double-tapped into creating a duplicate.
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className ?? ""} disabled:opacity-60`}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
          {pendingLabel ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
