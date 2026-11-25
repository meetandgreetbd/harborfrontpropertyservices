"use client";

import { useActionState, useState, startTransition } from "react";
import { createRequest } from "@/app/admin/request-actions";
import { priorities, sources } from "@/lib/leads";
import type { FormState } from "@/lib/validations/catalog";
import type { StaffOption } from "./RequestManager";
import { Card, Field, Select, TextArea, SaveBar } from "./form";

export function NewRequestForm({ staff, services }: { staff: StaffOption[]; services: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createRequest, { status: "idle" });
  const [kind, setKind] = useState("estimate");
  const err = (k: string) => state.fieldErrors?.[k];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Customer">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" name="name" error={err("name")} />
              <Field label="Phone" name="phone" type="tel" error={err("phone")} />
              <Field label="Email" name="email" type="email" error={err("email")} hint="Optional" />
              <Field label="Company" name="company" hint="Optional" />
            </div>
            <Field label="Property address" name="address" error={err("address")} />
          </Card>

          <Card title="Job">
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="Type" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="estimate">Quote request</option>
                <option value="work-order">Work order</option>
              </Select>
              <Select label="Service" name="service" defaultValue="">
                <option value="">Not sure / several things</option>
                {services.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              {kind === "work-order" && <Field label="Loan / property / PO number" name="reference" hint="Optional" />}
              <Field label="Access instructions" name="access" hint="Lockbox, gate code…" className={kind === "work-order" ? "" : "sm:col-span-2"} />
            </div>
            <TextArea label="What needs doing" name="message" rows={5} error={err("message")} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Handling">
            <Select label="How it came in" name="source" defaultValue="phone">
              {sources.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Select label="Priority" name="priority" defaultValue="normal">
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Select label="Assign to" name="assignedToId" defaultValue="">
              <option value="">Unassigned</option>
              {staff
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.role ? ` — ${s.role}` : ""}
                  </option>
                ))}
            </Select>
            <Field label="Scheduled for" name="scheduledFor" type="datetime-local" error={err("scheduledFor")} hint="Optional" />
          </Card>
        </div>
      </div>
      <div className="mt-6">
        <SaveBar state={state} pending={pending} label="Add request" />
      </div>
    </form>
  );
}
