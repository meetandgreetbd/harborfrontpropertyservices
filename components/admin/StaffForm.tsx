"use client";

import { useActionState, useState, startTransition } from "react";
import clsx from "clsx";
import { CheckCircle2, AlertCircle, UserPlus, UserSearch } from "lucide-react";
import { addStaff, saveStaff } from "@/app/admin/request-actions";
import type { FormState } from "@/lib/validations/catalog";
import { Field, TextArea, Toggle } from "./form";
import { UserPicker, type PickableUser } from "./UserPicker";

const swatches = ["#56664b", "#1f2d27", "#2f6f8f", "#7a4fa3", "#b5562b", "#b8860b", "#a33a4a", "#3d7a52"];

export type StaffFormData = { id: string; name: string; role: string; phone: string; email: string; color: string; notes: string; isActive: boolean };

/** Edit an existing crew member. */
export function StaffForm({ staff }: { staff: StaffFormData }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveStaff, { status: "idle" });
  const err = (k: string) => state.fieldErrors?.[k];
  const p = `staff-${staff.id}-`;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={staff.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" id={p + "name"} defaultValue={staff.name} error={err("name")} />
        <Field label="Job title" name="role" id={p + "role"} defaultValue={staff.role} placeholder="e.g. Lead technician" />
        <Field label="Phone" name="phone" id={p + "phone"} type="tel" defaultValue={staff.phone} />
        <Field label="Email" name="email" id={p + "email"} type="email" defaultValue={staff.email} error={err("email")} hint="Gets job assignments" />
      </div>
      <CrewExtras p={p} staff={staff} />
      <Submit pending={pending} label="Save" state={state} />
    </form>
  );
}

/**
 * Add a crew member. Every crew member has a login: pick an existing user (search) or create a new user,
 * who gets the Staff role. On success the server redirects back to the list (closing the dialog).
 */
export function AddStaffForm({ users }: { users: PickableUser[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addStaff, { status: "idle" });
  const [mode, setMode] = useState<"existing" | "new">(users.length ? "existing" : "new");
  const err = (k: string) => state.fieldErrors?.[k];
  const p = "staff-new-";
  const blank: StaffFormData = { id: "", name: "", role: "", phone: "", email: "", color: "#56664b", notes: "", isActive: true };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  const tabs = [
    { id: "existing" as const, label: "Existing user", icon: UserSearch },
    { id: "new" as const, label: "New user", icon: UserPlus },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="mode" value={mode} />
      <div className="grid grid-cols-2 gap-1 rounded-[4px] bg-canvas p-1 ring-1 ring-line" role="group" aria-label="Who is this crew member?">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={mode === t.id}
            onClick={() => setMode(t.id)}
            className={clsx(
              "inline-flex items-center justify-center gap-1.5 rounded-[3px] px-3 py-2 text-[0.86rem] font-medium",
              mode === t.id ? "bg-white text-night shadow-sm ring-1 ring-line" : "text-muted hover:text-night",
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <div>
          <UserPicker users={users} />
          {err("userId") && <p className="mt-1 text-[0.82rem] text-red-700">{err("userId")}</p>}
        </div>
      ) : (
        <div className="space-y-4 border-l-2 border-brand/40 pl-4">
          <p className="text-[0.8rem] text-muted">Creates a login with the <strong>Staff</strong> role — they&apos;ll only see jobs assigned to them.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" id={p + "name"} error={err("name")} autoComplete="off" />
            <Field label="Email (login)" name="email" id={p + "email"} type="email" error={err("email")} autoComplete="off" hint="Also gets job assignments" />
          </div>
          <Field label="Password" name="password" id={p + "password"} type="password" autoComplete="new-password" error={err("password")} hint="At least 10 characters" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Job title" name="role" id={p + "role"} placeholder="e.g. Lead technician" hint="Optional" />
        <Field label="Phone" name="phone" id={p + "phone"} type="tel" hint="Optional" />
      </div>
      <CrewExtras p={p} staff={blank} />
      <Submit pending={pending} label="Add staff member" state={state} />
    </form>
  );
}

function CrewExtras({ p, staff }: { p: string; staff: StaffFormData }) {
  return (
    <>
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
    </>
  );
}

function Submit({ pending, label, state }: { pending: boolean; label: string; state: FormState }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={pending} className="rounded-[3px] bg-night px-4 py-2 text-[0.88rem] text-canvas hover:bg-night-600 disabled:opacity-60">
        {pending ? "Saving…" : label}
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
  );
}
