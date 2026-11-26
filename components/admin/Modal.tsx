"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Button + modal dialog. `children` is rendered only while open (forms start fresh each time).
 * Closes with ✕, Esc or a click on the backdrop. `children` may be a function receiving `close`.
 */
export function Modal({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  subtitle,
  children,
  width = "40rem",
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  /** Accessible name when the trigger is an icon only. */
  triggerLabel?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  width?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName} title={triggerLabel} aria-label={triggerLabel}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        onClose={close}
        onClick={(e) => e.target === e.currentTarget && close()}
        aria-label={title}
        style={{ width: `min(${width}, calc(100vw - 2rem))` }}
        className="m-auto rounded-lg border border-line bg-white p-0 text-left shadow-2xl backdrop:bg-night/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="font-sans text-[1.1rem] font-semibold text-night">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[0.82rem] text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Close" className="rounded p-1.5 text-muted hover:bg-canvas hover:text-night">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{open && (typeof children === "function" ? children(close) : children)}</div>
      </dialog>
    </>
  );
}
