"use client";

import { useActionState, useState, useTransition, startTransition } from "react";
import Link from "next/link";
import { Check, X, Plus, Pencil, List } from "lucide-react";
import { saveCategory, deleteCategory } from "@/app/admin/catalog-actions";
import type { FormState } from "@/lib/validations/catalog";
import { inputCls } from "./form";
import { DeleteButton, IconLink } from "./RowActions";

/** Add a new category (top of the categories page). */
export function AddCategoryForm({ nextSort }: { nextSort: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory, { status: "idle" });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      await action(fd);
      form.reset();
    });
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input name="name" placeholder="New category name" aria-label="New category name" className={inputCls(state.status === "error", "w-72")} />
      <input name="sortOrder" type="number" min={0} defaultValue={nextSort} aria-label="Sort order" title="Sort order" className={inputCls(false, "w-20")} />
      <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-3.5 py-2 text-[0.88rem] text-canvas hover:bg-night-600 disabled:opacity-60">
        <Plus size={16} /> {pending ? "Adding…" : "Add category"}
      </button>
      {state.message && <span className={`text-[0.82rem] ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{state.message}</span>}
    </form>
  );
}

/** One table row: view mode with icon actions, or inline edit mode. */
export function CategoryRow({
  id,
  name,
  slug,
  sortOrder,
  serviceCount,
  publishedCount,
}: {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  serviceCount: number;
  publishedCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const result = await saveCategory({ status: "idle" }, fd);
      setState(result);
      if (result.status === "saved") setEditing(false);
    });
  };

  if (editing) {
    return (
      <tr className="bg-canvas/40">
        <td colSpan={5} className="px-4 py-3">
          <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={id} />
            <input name="sortOrder" type="number" min={0} defaultValue={sortOrder} aria-label="Sort order" className={inputCls(false, "w-20")} />
            <input name="name" defaultValue={name} aria-label="Category name" autoFocus className={inputCls(state.status === "error", "w-72")} />
            <button disabled={pending} title="Save" className="inline-flex h-9 items-center gap-1.5 rounded-[3px] bg-night px-3 text-[0.86rem] text-canvas hover:bg-night-600 disabled:opacity-60">
              <Check size={15} /> Save
            </button>
            <button type="button" title="Cancel" onClick={() => setEditing(false)} className="inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-line px-3 text-[0.86rem] text-muted hover:text-night">
              <X size={15} /> Cancel
            </button>
            {state.status === "error" && <span className="text-[0.82rem] text-red-700">{state.message}</span>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-canvas/50">
      <td className="tabular w-16 px-4 py-3 text-muted">{sortOrder}</td>
      <td className="px-4 py-3">
        <span className="font-medium text-night">{name}</span>
        <div className="text-[0.78rem] text-muted">{slug}</div>
      </td>
      <td className="px-4 py-3">
        <Link href={`/admin/services?category=${id}`} className="text-night hover:underline">
          {serviceCount} service{serviceCount === 1 ? "" : "s"}
        </Link>
        <span className="text-[0.8rem] text-muted"> · {publishedCount} published</span>
      </td>
      <td className="px-4 py-3 text-[0.82rem] text-emerald-700">{state.status === "saved" ? state.message : ""}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            title={`Edit ${name}`}
            onClick={() => {
              setState({ status: "idle" });
              setEditing(true);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-muted hover:bg-canvas hover:text-night"
          >
            <Pencil size={16} strokeWidth={1.75} />
            <span className="sr-only">Edit {name}</span>
          </button>
          <IconLink href={`/admin/services?category=${id}`} label={`View services in ${name}`} icon={List} />
          <DeleteButton
            id={id}
            name={name}
            action={deleteCategory}
            disabledReason={serviceCount > 0 ? `Can't delete: ${serviceCount} service(s) use this category. Move them first.` : undefined}
          />
        </div>
      </td>
    </tr>
  );
}
