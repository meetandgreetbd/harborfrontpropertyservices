import clsx from "clsx";
import { kindLabel, priorityMeta, statusMeta } from "@/lib/leads";

export function AdminHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-white px-6 py-6 md:px-10">
      <div>
        <h1 className="font-sans text-[1.5rem] font-semibold tracking-tight text-night">{title}</h1>
        {subtitle && <p className="mt-1 text-[0.92rem] text-muted">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span className={clsx("inline-block rounded-full border px-2.5 py-0.5 text-[0.75rem] font-medium", meta.className)}>
      {meta.label}
    </span>
  );
}

export function KindBadge({ kind }: { kind: string }) {
  return (
    <span
      className={clsx(
        "inline-block whitespace-nowrap rounded-[3px] px-1.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide",
        kind === "work-order" ? "bg-night text-canvas" : kind === "booking" ? "bg-brand text-white" : "bg-canvas-2 text-night",
      )}
    >
      {kindLabel(kind)}
    </span>
  );
}

export function AssigneeBadge({ staff }: { staff: { name: string; color: string } | null }) {
  if (!staff) return <span className="text-[0.82rem] italic text-amber-800">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.86rem]">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: staff.color }} aria-hidden="true" />
      {staff.name}
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: string }) {
  const meta = priorityMeta(priority);
  if (priority === "normal") return <span className="text-[0.82rem] text-muted">Normal</span>;
  return <span className={clsx("text-[0.82rem]", meta.className)}>{meta.label}</span>;
}

export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

export function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

export function AdminLoading() {
  return (
    <div className="animate-pulse space-y-3 p-6 md:p-10" aria-busy="true">
      <div className="h-7 w-48 bg-line/60" />
      <div className="h-4 w-72 bg-line/40" />
      <div className="mt-8 h-40 w-full bg-line/30" />
    </div>
  );
}
