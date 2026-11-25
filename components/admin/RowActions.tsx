"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Pencil, Trash2, Eye, EyeOff, ExternalLink, Check, X, Loader2 } from "lucide-react";

const iconBtn = "inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-muted transition-colors hover:bg-canvas hover:text-night";

/** Icon link with tooltip + screen-reader label. */
export function IconLink({
  href,
  label,
  icon: Icon,
  external,
}: {
  href: string;
  label: string;
  icon: typeof Pencil;
  external?: boolean;
}) {
  const props = external ? { target: "_blank", rel: "noreferrer" } : {};
  return (
    <Link href={href} title={label} className={iconBtn} {...props}>
      <Icon size={16} strokeWidth={1.75} />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export const EditLink = ({ href, label = "Edit" }: { href: string; label?: string }) => <IconLink href={href} label={label} icon={Pencil} />;
export const ViewLink = ({ href, label = "View on website" }: { href: string; label?: string }) => (
  <IconLink href={href} label={label} icon={ExternalLink} external />
);

/** Calls a server action with { id } — used for publish toggles. */
export function ToggleButton({
  id,
  on,
  action,
  onLabel = "Unpublish",
  offLabel = "Publish",
}: {
  id: string;
  on: boolean;
  action: (fd: FormData) => Promise<void>;
  onLabel?: string;
  offLabel?: string;
}) {
  const [pending, start] = useTransition();
  const label = on ? onLabel : offLabel;
  return (
    <button
      type="button"
      title={label}
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        start(() => action(fd));
      }}
      className={iconBtn}
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : on ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
      <span className="sr-only">{label}</span>
    </button>
  );
}

/**
 * Two-step delete: trash icon → inline "Delete? ✓ ✕". No browser popup.
 * The action receives { id, from: "list" } so it can refresh instead of redirecting.
 */
export function DeleteButton({
  id,
  name,
  action,
  disabledReason,
}: {
  id: string;
  name: string;
  action: (fd: FormData) => Promise<void>;
  disabledReason?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (disabledReason) {
    return (
      <span title={disabledReason} className={clsx(iconBtn, "cursor-not-allowed opacity-35 hover:bg-transparent hover:text-muted")}>
        <Trash2 size={16} strokeWidth={1.75} />
        <span className="sr-only">{disabledReason}</span>
      </span>
    );
  }

  if (!confirming) {
    return (
      <button type="button" title={`Delete ${name}`} onClick={() => setConfirming(true)} className={clsx(iconBtn, "hover:bg-red-50 hover:text-red-700")}>
        <Trash2 size={16} strokeWidth={1.75} />
        <span className="sr-only">Delete {name}</span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] border border-red-200 bg-red-50 py-0.5 pl-2 pr-0.5 text-[0.78rem] text-red-800" role="group" aria-label={`Confirm delete ${name}`}>
      Delete?
      <button
        type="button"
        title="Yes, delete"
        disabled={pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("id", id);
          fd.set("from", "list");
          start(() => action(fd));
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] bg-red-700 text-white hover:bg-red-800"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        <span className="sr-only">Yes, delete</span>
      </button>
      <button type="button" title="Cancel" onClick={() => setConfirming(false)} className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] text-red-800 hover:bg-red-100">
        <X size={13} />
        <span className="sr-only">Cancel</span>
      </button>
    </span>
  );
}
