"use client";

import { useEffect, useSyncExternalStore } from "react";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type Toast = { id: number; type: "success" | "error"; title: string; message?: string };

/** Tiny module-level store: call `toast.success(...)` from any client component; <Toaster /> renders them. */
let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(type: Toast["type"], title: string, message?: string) {
  toasts = [...toasts, { id: nextId++, type, title, message }].slice(-3);
  emit();
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, message?: string) => push("success", title, message),
  error: (title: string, message?: string) => push("error", title, message),
};

const EMPTY: Toast[] = [];
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function Toaster() {
  // Server snapshot is always empty, so SSR and the first client render match.
  const list = useSyncExternalStore(subscribe, () => toasts, () => EMPTY);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {list.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t }: { toast: Toast }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), t.type === "error" ? 8000 : 6000);
    return () => clearTimeout(timer);
  }, [t.id, t.type]);

  const Icon = t.type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={t.type === "error" ? "alert" : "status"}
      className={clsx(
        "animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_18px_50px_-12px_rgb(10_15_28/0.35)]",
        t.type === "success" ? "border-brand/30" : "border-red-200",
      )}
    >
      <Icon size={22} strokeWidth={1.8} aria-hidden="true" className={clsx("mt-0.5 shrink-0", t.type === "success" ? "text-brand-700" : "text-red-700")} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-night">{t.title}</p>
        {t.message && <p className="mt-1 text-[0.88rem] leading-snug text-muted">{t.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(t.id)}
        className="-m-1 rounded-full p-1 text-muted transition-colors hover:bg-line/60 hover:text-night"
      >
        <X size={16} aria-hidden="true" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}
