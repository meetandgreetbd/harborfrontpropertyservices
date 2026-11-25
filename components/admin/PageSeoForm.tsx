"use client";

import { useActionState, useState, startTransition } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { savePageSeo } from "@/app/admin/catalog-actions";
import type { FormState } from "@/lib/validations/catalog";
import { SeoPanel } from "./form";

/** Collapsible SEO editor for one fixed page (home, about, contact…). */
export function PageSeoForm({
  path,
  label,
  defaultTitle,
  defaultDescription,
  title,
  description,
  noIndex,
}: {
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  title: string;
  description: string;
  noIndex: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(savePageSeo, { status: "idle" });
  const customised = Boolean(title || description);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left hover:bg-canvas/50"
      >
        <span className="min-w-[12rem] font-medium text-night">{label}</span>
        <span className="text-[0.82rem] text-muted">{path}</span>
        <span className="ml-auto flex items-center gap-2">
          {noIndex && <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.72rem] text-amber-900">noindex</span>}
          <span
            className={clsx(
              "rounded-full border px-2 py-0.5 text-[0.72rem]",
              customised ? "border-sky-200 bg-sky-50 text-sky-900" : "border-neutral-200 bg-neutral-100 text-neutral-600",
            )}
          >
            {customised ? "Custom" : "Default"}
          </span>
          <ChevronDown size={16} className={clsx("text-muted transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <form onSubmit={onSubmit} className="space-y-4 border-t border-line bg-canvas/20 px-5 py-5">
          <input type="hidden" name="path" value={path} />
          <SeoPanel
            path={path}
            defaultTitle={defaultTitle}
            defaultDescription={defaultDescription}
            title={title}
            description={description}
            noIndex={noIndex}
            names={{ title: "title", description: "description", noIndex: "noIndex" }}
          />
          <div className="flex items-center gap-3">
            <button disabled={pending} className="rounded-[3px] bg-night px-4 py-2 text-[0.88rem] text-canvas hover:bg-night-600 disabled:opacity-60">
              {pending ? "Saving…" : "Save SEO"}
            </button>
            {state.message && (
              <span className={clsx("text-[0.85rem]", state.status === "error" ? "text-red-700" : "text-emerald-700")}>{state.message}</span>
            )}
            <span className="ml-auto text-[0.78rem] text-muted">Clear both fields and switch noindex off to go back to defaults.</span>
          </div>
        </form>
      )}
    </div>
  );
}
