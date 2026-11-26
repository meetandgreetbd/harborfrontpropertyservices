"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown, Search, UserRound, X } from "lucide-react";
import { roleLabel } from "@/lib/auth/roles";

export type PickableUser = { id: string; name: string; email: string; role: string };

/**
 * Select2-style searchable select for a user (login). Click the box → dropdown with a search field on top.
 * Keyboard: ↑/↓ to move, Enter to pick, Esc to close. Submits `userId`.
 */
export function UserPicker({ users, onPick }: { users: PickableUser[]; onPick?: (u: PickableUser | null) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<PickableUser | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)) : users;
  }, [q, users]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openList = () => {
    setOpen(true);
    setQ("");
    setActive(0);
    requestAnimationFrame(() => search.current?.focus());
  };

  const pick = (u: PickableUser | null) => {
    setPicked(u);
    setOpen(false);
    onPick?.(u);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault(); // don't submit the form
      if (matches[active]) pick(matches[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // don't close the surrounding dialog
      setOpen(false);
    }
  };

  return (
    <div ref={wrap} className="relative">
      <input type="hidden" name="userId" value={picked?.id ?? ""} />
      <p className="text-[0.85rem] font-medium">User (login)</p>

      {/* The "select" box */}
      <div
        className={clsx(
          "mt-1.5 flex w-full items-center gap-2 rounded-[3px] border bg-white px-3 py-2 text-left text-[0.9rem]",
          open ? "border-night ring-1 ring-night" : "border-line",
          !users.length && "bg-canvas text-muted",
        )}
      >
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openList())}
          disabled={!users.length}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed"
        >
          {picked ? (
            <>
              <UserRound size={16} className="shrink-0 text-brand" />
              <span className="truncate">
                <span className="font-medium text-night">{picked.name}</span>
                <span className="text-muted"> · {picked.email}</span>
              </span>
              <span className="ml-auto shrink-0 rounded-full border border-line px-2 py-0.5 text-[0.7rem] text-muted">{roleLabel(picked.role)}</span>
            </>
          ) : (
            <span className="text-muted">{users.length ? "Select a user…" : "No users without a crew record"}</span>
          )}
        </button>
        {picked && (
          <button type="button" onClick={() => pick(null)} aria-label="Clear selection" className="rounded p-0.5 text-muted hover:bg-canvas hover:text-night">
            <X size={14} />
          </button>
        )}
        <ChevronDown size={16} className={clsx("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </div>

      {/* Dropdown with search */}
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-[3px] border border-line bg-white shadow-xl">
          <div className="relative border-b border-line p-2">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={search}
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              placeholder="Type a name or email…"
              aria-label="Search users"
              aria-controls={listId}
              aria-activedescendant={matches[active] ? `${listId}-${matches[active].id}` : undefined}
              role="combobox"
              aria-expanded="true"
              className="block w-full rounded-[3px] border border-line py-1.5 pl-8 pr-2 text-[0.88rem] focus:border-night focus:outline-none"
            />
          </div>
          <ul id={listId} role="listbox" aria-label="Users" className="max-h-60 overflow-y-auto py-1">
            {matches.map((u, i) => (
              <li
                key={u.id}
                id={`${listId}-${u.id}`}
                role="option"
                aria-selected={picked?.id === u.id}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus; pick on click
                  pick(u);
                }}
                className={clsx("flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[0.86rem]", i === active && "bg-brand-50")}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-night">{u.name}</span>
                  <span className="block truncate text-[0.78rem] text-muted">{u.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={clsx("rounded-full border px-2 py-0.5 text-[0.7rem]", u.role === "staff" ? "border-brand/40 text-brand" : "border-line text-muted")}>
                    {roleLabel(u.role)}
                  </span>
                  {picked?.id === u.id && <Check size={14} className="text-brand" />}
                </span>
              </li>
            ))}
            {matches.length === 0 && <li className="px-3 py-3 text-[0.84rem] text-muted">No results for “{q}”.</li>}
          </ul>
        </div>
      )}

      <p className="mt-1.5 text-[0.78rem] text-muted">
        Pick the person&apos;s user login. Not listed? Switch to <strong>New user</strong> to create one.
      </p>
    </div>
  );
}
