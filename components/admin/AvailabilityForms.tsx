"use client";

import { useActionState, useState, startTransition } from "react";
import { CheckCircle2, AlertCircle, Save, Ban } from "lucide-react";
import { addBlockedTime, saveWorkingHours } from "@/app/admin/availability-actions";
import type { FormState } from "@/lib/validations/catalog";
import { inputCls, Toggle } from "./form";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const order = [1, 2, 3, 4, 5, 6, 0]; // show Monday first

function Result({ state }: { state: FormState }) {
  if (state.status === "saved")
    return (
      <span role="status" className="inline-flex items-center gap-1.5 text-[0.86rem] text-emerald-700">
        <CheckCircle2 size={15} /> {state.message}
      </span>
    );
  if (state.status === "error")
    return (
      <span role="alert" className="inline-flex items-center gap-1.5 text-[0.86rem] text-red-700">
        <AlertCircle size={15} /> {state.message}
      </span>
    );
  return null;
}

export function WorkingHoursForm({ hours }: { hours: { weekday: number; isOpen: boolean; startTime: string; endTime: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveWorkingHours, { status: "idle" });
  const [open, setOpen] = useState<Record<number, boolean>>(() => Object.fromEntries(hours.map((h) => [h.weekday, h.isOpen])));
  const get = (wd: number) => hours.find((h) => h.weekday === wd) ?? { weekday: wd, isOpen: false, startTime: "08:00", endTime: "17:00" };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      {order.map((wd) => {
        const h = get(wd);
        return (
          <div key={wd} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line py-3 last:border-b-0">
            <span className="w-28 font-medium text-night">{dayNames[wd]}</span>
            <div className="w-40">
              <Toggle name={`open-${wd}`} label={open[wd] ? "Open" : "Closed"} checked={open[wd]} onChange={(v) => setOpen({ ...open, [wd]: v })} />
            </div>
            <div className={`flex items-center gap-2 transition-opacity ${open[wd] ? "" : "pointer-events-none opacity-35"}`}>
              <input type="time" step={900} name={`start-${wd}`} defaultValue={h.startTime} aria-label={`${dayNames[wd]} opening time`} className={inputCls(false, "w-32")} />
              <span className="text-muted">to</span>
              <input type="time" step={900} name={`end-${wd}`} defaultValue={h.endTime} aria-label={`${dayNames[wd]} closing time`} className={inputCls(false, "w-32")} />
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3 pt-4">
        <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-4 py-2 text-[0.88rem] text-white hover:bg-night-600 disabled:opacity-60">
          <Save size={15} /> {pending ? "Saving…" : "Save hours"}
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

export function BlockTimeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addBlockedTime, { status: "idle" });
  const [allDay, setAllDay] = useState(true);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      await action(fd);
    });
  };
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-medium">
          From
          <input type="date" name="startDate" required className={inputCls()} />
        </label>
        <label className="block text-[0.85rem] font-medium">
          To
          <input type="date" name="endDate" required className={inputCls()} />
        </label>
      </div>
      <Toggle name="allDay" label="All day" description="Turn off to block only part of a day." checked={allDay} onChange={setAllDay} />
      {!allDay && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[0.85rem] font-medium">
            Start time
            <input type="time" step={900} name="startTime" defaultValue="12:00" className={inputCls()} />
          </label>
          <label className="block text-[0.85rem] font-medium">
            End time
            <input type="time" step={900} name="endTime" defaultValue="17:00" className={inputCls()} />
          </label>
        </div>
      )}
      <label className="block text-[0.85rem] font-medium">
        Reason <span className="font-normal text-muted">(internal)</span>
        <input name="reason" placeholder="e.g. Thanksgiving, crew training" className={inputCls()} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-4 py-2 text-[0.88rem] text-white hover:bg-night-600 disabled:opacity-60">
          <Ban size={15} /> {pending ? "Saving…" : "Block this time"}
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}
