"use client";

import { useActionState, useState, startTransition } from "react";
import { CheckCircle2, AlertCircle, UserPlus, Save } from "lucide-react";
import { saveUser } from "@/app/admin/user-actions";
import { roles } from "@/lib/auth/roles";
import type { FormState } from "@/lib/validations/catalog";
import { Field, Select, Toggle } from "./form";

export type UserFormData = { id: string; name: string; email: string; role: string; isActive: boolean };

/** Login + role only. Crew records are created (and linked to a user) under Staff (crew) → Add staff member. */
export function UserForm({ user, isSelf = false }: { user: UserFormData; isSelf?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveUser, { status: "idle" });
  const [role, setRole] = useState(user.role);
  const err = (k: string) => state.fieldErrors?.[k];
  const p = user.id ? `user-${user.id}-` : "user-new-";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={user.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" id={p + "name"} defaultValue={user.name} error={err("name")} />
        <Field label="Email (login)" name="email" id={p + "email"} type="email" defaultValue={user.email} error={err("email")} autoComplete="off" />
        <Select label="Role" name="role" id={p + "role"} value={role} onChange={(e) => setRole(e.target.value)} disabled={isSelf} hint={isSelf ? "Can't change your own role" : undefined}>
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      {isSelf && <input type="hidden" name="role" value={user.role} />}
      <p className="text-[0.8rem] text-muted">{roles.find((r) => r.value === role)?.description}</p>
      {role === "staff" && (
        <p className="border-l-2 border-brand/40 pl-3 text-[0.8rem] text-muted">
          To assign jobs to this person, add them under <strong>Staff (crew) → Add staff member</strong> after saving.
        </p>
      )}

      <Field
        label={user.id ? "New password" : "Password"}
        name="password"
        id={p + "password"}
        type="password"
        autoComplete="new-password"
        error={err("password")}
        hint={user.id ? "Leave empty to keep the current password" : "At least 10 characters"}
      />

      {isSelf ? (
        <input type="hidden" name="isActive" value="on" />
      ) : (
        <Toggle name="isActive" label="Active" description="Deactivated users can't log in." defaultChecked={user.isActive} />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-4 py-2 text-[0.88rem] text-canvas hover:bg-night-600 disabled:opacity-60">
          {user.id ? <Save size={15} /> : <UserPlus size={15} />}
          {pending ? "Saving…" : user.id ? "Save" : "Add user"}
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
