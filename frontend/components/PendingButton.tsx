"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function PendingButton({
  children,
  pendingLabel = "Working...",
  className,
  disabled = false
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={disabled || pending}>
      {pending ? (
        <>
          <span className="mini-loader" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

