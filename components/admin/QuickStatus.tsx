"use client";

import { useState, useTransition } from "react";
import { quickSetStatus } from "@/app/admin/request-actions";
import { leadStatuses, statusMeta } from "@/lib/leads";

/** Status dropdown in the requests table — changes save immediately (no form reset). */
export function QuickStatus({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      aria-label="Status"
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", next);
        startTransition(() => quickSetStatus(fd));
      }}
      className={`cursor-pointer rounded-full border px-2 py-0.5 text-[0.75rem] font-medium disabled:opacity-60 ${statusMeta(value).className}`}
    >
      {leadStatuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
