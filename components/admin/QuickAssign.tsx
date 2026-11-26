"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Pencil, UserPlus, X } from "lucide-react";
import { quickAssign } from "@/app/admin/request-actions";

type StaffOption = { id: string; name: string; color?: string; isActive: boolean };

/**
 * Requests table, "Assigned to" column (managers/admins only).
 * Unassigned → an "Assign…" dropdown. Assigned → the person's name with a "Change" button that opens the dropdown
 * (pick someone else, or "Unassign"). Saves immediately and emails the crew member.
 */
export function QuickAssign({ id, assignedToId, staff }: { id: string; assignedToId: string | null; staff: StaffOption[] }) {
  const [value, setValue] = useState(assignedToId ?? "");
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  // Inactive crew can't take new work, but keep the current one visible.
  const options = staff.filter((s) => s.isActive || s.id === assignedToId);
  const current = staff.find((s) => s.id === value);

  const save = (next: string) => {
    const previous = value;
    setValue(next);
    setEditing(false);
    setNote(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("assignedToId", next);
    startTransition(async () => {
      const res = await quickAssign(fd);
      if (!res.ok) setValue(previous);
      setNote(res.message ? { ok: res.ok, text: res.message } : null);
    });
  };

  const showSelect = !current || editing;

  return (
    <div className="min-w-40">
      {showSelect ? (
        <div className="flex items-center gap-1">
          <select
            value={current ? value : ""}
            aria-label={current ? "Change who this is assigned to" : "Assign to"}
            disabled={pending}
            autoFocus={editing}
            onChange={(e) => save(e.target.value)}
            className={clsx(
              "max-w-44 cursor-pointer rounded-md border px-2 py-1 text-[0.82rem] disabled:opacity-60",
              current ? "border-line bg-white text-ink" : "border-amber-300 bg-amber-50 font-medium text-amber-900",
            )}
          >
            {current ? <option value="">— Unassign —</option> : <option value="">Assign…</option>}
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {!s.isActive ? " (inactive)" : ""}
              </option>
            ))}
          </select>
          {editing && (
            <button type="button" onClick={() => setEditing(false)} aria-label="Cancel" className="rounded p-1 text-muted hover:bg-canvas hover:text-night">
              <X size={14} />
            </button>
          )}
          {!current && !pending && <UserPlus size={14} className="text-amber-700" aria-hidden="true" />}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[0.86rem] text-ink">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: current.color ?? "#56664b" }} aria-hidden="true" />
            {current.name}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[0.74rem] text-muted hover:border-night hover:text-night disabled:opacity-50"
          >
            <Pencil size={11} /> Change
          </button>
        </div>
      )}
      {pending && <p className="mt-1 text-[0.72rem] text-muted">Saving…</p>}
      {note && !pending && (
        <p role="status" className={clsx("mt-1 max-w-56 text-[0.72rem] leading-snug", note.ok ? "text-emerald-700" : "text-red-700")}>
          {note.text}
        </p>
      )}
    </div>
  );
}
