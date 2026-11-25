"use client";

import { useActionState, startTransition } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { saveStaff } from "@/app/admin/request-actions";
import type { FormState } from "@/lib/validations/catalog";
import { Field, TextArea, Toggle } from "./form";

const swatches = ["#56664b", "#1f2d27", "#2f6f8f", "#7a4fa3", "#b5562b", "#b8860b", "#a33a4a", "#3d7a52"];

export type StaffFormData = { id: string; name: string; role: string; phone: string; email: string; color: string; notes: string; isActive: boolean };

export function StaffForm({ staff, onDone }: { staff: StaffFormData; onDone?: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveStaff, { status: "idle" });
  const err = (k: string) => state.fieldErrors?.[k];
  const p = staff.id ? `staff-${staff.id}-` : "staff-new-"; // unique field ids per form

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      await action(fd);
      if (!staff.id) form.reset(); // clear the "add" form for the next person
      onDone?.();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={staff.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" id={p + "name"} defaultValue={staff.name} error={err("name")} />
        <Field label="Role" name="role" id={p + "role"} defaultValue={staff.role} placeholder="e.g. Lead technician" />
        <Field label="Phone" name="phone" id={p + "phone"} type="tel" defaultValue={staff.phone} />
        <Field label="Email" name="email" id={p + "email"} type="email" defaultValue={staff.email} error={err("email")} hint="Gets job assignments" />
      </div>
      <fieldset>
        <legend className="text-[0.85rem] font-medium">Colour</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {swatches.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={staff.color === c} className="peer sr-only" />
              <span
                className="block h-7 w-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-night peer-focus-visible:ring-2 peer-focus-visible:ring-night"
                style={{ background: c }}
              />
              <span className="sr-only">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextArea label="Notes" name="notes" id={p + "notes"} defaultValue={staff.notes} rows={2} hint="Skills, licenses, availability" />
      <Toggle name="isActive" label="Active" description="Inactive staff can't be assigned new jobs." defaultChecked={staff.isActive} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-[3px] bg-night px-4 py-2 text-[0.88rem] text-canvas hover:bg-night-600 disabled:opacity-60">
          {pending ? "Saving…" : staff.id ? "Save" : "Add staff member"}
        </button>
        {state.status === "saved" && (
          <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-emerald-700">
            <CheckCircle2 size={15} /> {state.message}
          </span>
        )}
        {state.status === "error" && (
          <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-red-700">
            <AlertCircle size={15} /> {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
