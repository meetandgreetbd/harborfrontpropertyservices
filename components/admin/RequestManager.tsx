"use client";

import { useActionState, useState, startTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updateRequest } from "@/app/admin/request-actions";
import { leadStatuses, priorities } from "@/lib/leads";
import type { FormState } from "@/lib/validations/catalog";
import { inputCls } from "./form";

export type StaffOption = { id: string; name: string; role: string; color: string; email: string; isActive: boolean };

/** Status / priority / assignment / schedule / notes for one service request. */
export function RequestManager({
  lead,
  staff,
  limited = false,
}: {
  lead: { id: string; status: string; priority: string; assignedToId: string | null; scheduledFor: string; notes: string };
  staff: StaffOption[];
  /** Staff logins: can change status / notes / updates only (assignment, schedule, priority are read-only). */
  limited?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateRequest, { status: "idle" });
  const [status, setStatus] = useState(lead.status);
  const [assignee, setAssignee] = useState(lead.assignedToId ?? "");
  const selected = staff.find((s) => s.id === assignee);
  const visibleStaff = staff.filter((s) => s.isActive || s.id === lead.assignedToId);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(() => action(fd));
    // clear the one-off comment box after sending
    const comment = form.elements.namedItem("comment") as HTMLTextAreaElement | null;
    if (comment) comment.value = "";
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="status" value={status} />

      {/* Status: one click per stage */}
      <fieldset>
        <legend className="text-[0.85rem] font-medium">Status</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {leadStatuses.map((s) => (
            <button
              key={s.value}
              type="button"
              title={s.hint}
              aria-pressed={status === s.value}
              onClick={() => setStatus(s.value)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-[0.82rem] transition-colors",
                status === s.value ? `${s.className} ring-2 ring-night/30 font-medium` : "border-line bg-white text-muted hover:border-night hover:text-night",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="assignedToId" className="text-[0.85rem] font-medium">
            Assigned to
          </label>
          <div className="relative">
            {selected && (
              <span className="pointer-events-none absolute left-3 top-1/2 mt-[3px] h-2.5 w-2.5 -translate-y-1/2 rounded-full" style={{ background: selected.color }} />
            )}
            <select
              id="assignedToId"
              name="assignedToId"
              value={assignee}
              disabled={limited}
              onChange={(e) => setAssignee(e.target.value)}
              className={clsx(inputCls(), selected && "pl-8")}
            >
              <option value="">Unassigned</option>
              {visibleStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.role ? ` — ${s.role}` : ""}
                  {!s.isActive ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </div>
          {!limited && staff.length === 0 && (
            <p className="mt-1 text-[0.78rem] text-muted">
              No staff yet —{" "}
              <Link href="/admin/staff" className="text-night underline">
                add your crew
              </Link>
              .
            </p>
          )}
        </div>
        <div>
          <label htmlFor="scheduledFor" className="text-[0.85rem] font-medium">
            Scheduled for
          </label>
          <input id="scheduledFor" name="scheduledFor" type="datetime-local" disabled={limited} defaultValue={lead.scheduledFor} className={inputCls(!!state.fieldErrors?.scheduledFor)} />
        </div>
        <div>
          <label htmlFor="priority" className="text-[0.85rem] font-medium">
            Priority
          </label>
          <select id="priority" name="priority" disabled={limited} defaultValue={lead.priority} className={inputCls()}>
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {limited && (
        <p className="-mt-2 text-[0.8rem] text-muted">Assignment, schedule and priority are set by your manager.</p>
      )}
      {!limited && selected?.email && (
        <label className="flex items-center gap-2 text-[0.85rem] text-muted">
          <input type="checkbox" name="notifyStaff" />
          Email the job details to {selected.name} when saving
          <span className="text-[0.78rem]">(sent automatically when you assign someone new)</span>
        </label>
      )}

      <div>
        <label htmlFor="notes" className="text-[0.85rem] font-medium">
          Internal notes <span className="font-normal text-muted">(only visible in admin)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={lead.notes}
          placeholder="Price quoted, materials needed, gate code confirmed…"
          className={inputCls()}
        />
      </div>

      <div>
        <label htmlFor="comment" className="text-[0.85rem] font-medium">
          Add an update to the history <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea id="comment" name="comment" rows={2} placeholder="e.g. Called customer, left voicemail." className={inputCls()} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="rounded-[3px] bg-night px-5 py-2.5 font-medium text-canvas hover:bg-night-600 disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state.status === "saved" && (
          <span role="status" className="inline-flex items-center gap-1.5 text-[0.88rem] text-emerald-700">
            <CheckCircle2 size={16} /> {state.message}
          </span>
        )}
        {state.status === "error" && (
          <span role="alert" className="inline-flex items-center gap-1.5 text-[0.88rem] text-red-700">
            <AlertCircle size={16} /> {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
