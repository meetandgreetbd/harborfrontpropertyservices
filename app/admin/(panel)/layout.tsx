import { Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { roleLabel } from "@/lib/auth/roles";
import { logout } from "../actions";
import { AdminNav, AdminNavFallback } from "./NavLink";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-night text-white/90 md:sticky md:top-0 md:h-dvh md:w-60">
        <div className="border-b border-canvas/10 px-5 py-5">
          <Link href="/admin" className="block">
            <span className="font-display text-lg font-semibold tracking-[0.06em] text-canvas">HARBORFRONT</span>
            <span className="mt-0.5 block text-[0.62rem] tracking-[0.28em] text-brand-400">ADMIN</span>
          </Link>
        </div>
        <nav aria-label="Admin" className="flex max-h-[45vh] flex-col gap-0.5 overflow-y-auto px-3 py-3 md:max-h-none md:flex-1">
          <Suspense fallback={<AdminNavFallback />}>
            <NavForUser />
          </Suspense>
        </nav>
        <div className="hidden border-t border-canvas/10 px-5 py-4 md:block">
          <Suspense fallback={<div className="h-10" />}>
            <CurrentUser />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Menu filtered to what this user's role can open. */
async function NavForUser() {
  const user = await requireAdmin();
  return <AdminNav role={user.role} />;
}

async function CurrentUser() {
  const user = await requireAdmin();
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/admin/profile" className="min-w-0 hover:text-canvas" title="My profile">
        <p className="truncate text-[0.88rem] text-canvas">{user.name}</p>
        <p className="truncate text-[0.75rem] text-canvas/50">{roleLabel(user.role)} · {user.email}</p>
      </Link>
      <form action={logout}>
        <button type="submit" title="Log out" className="rounded-[3px] p-2 hover:bg-canvas/10 hover:text-canvas">
          <LogOut size={16} strokeWidth={1.75} />
          <span className="sr-only">Log out</span>
        </button>
      </form>
    </div>
  );
}
