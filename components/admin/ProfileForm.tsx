"use client";

import { useActionState, startTransition } from "react";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";
import { updateProfile } from "@/app/admin/user-actions";
import type { FormState } from "@/lib/validations/catalog";
import { Card, Field } from "./form";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, { status: "idle" });
  const err = (k: string) => state.fieldErrors?.[k];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      await action(fd);
      // never leave passwords sitting in the form
      for (const n of ["currentPassword", "newPassword", "confirmPassword"]) (form.elements.namedItem(n) as HTMLInputElement).value = "";
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card title="Your details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" defaultValue={name} error={err("name")} autoComplete="name" />
          <Field label="Email (login)" name="email" type="email" defaultValue={email} error={err("email")} autoComplete="email" />
        </div>
      </Card>
      <Card title="Change password" description="Leave empty to keep your current password.">
        <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" error={err("currentPassword")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" name="newPassword" type="password" autoComplete="new-password" error={err("newPassword")} hint="10+ characters" />
          <Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" error={err("confirmPassword")} />
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-5 py-2.5 font-medium text-canvas hover:bg-night-600 disabled:opacity-60">
          <Save size={16} /> {pending ? "Saving…" : "Save profile"}
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
