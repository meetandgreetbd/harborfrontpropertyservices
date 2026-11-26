"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { can, type Permission } from "@/lib/auth/roles";
import {
  LayoutDashboard,
  Inbox,
  ExternalLink,
  Wrench,
  MapPin,
  Search,
  Users,
  ChevronDown,
  List,
  PlusCircle,
  FolderTree,
  FileText,
  UserCog,
  CircleUser,
  Settings,
  BarChart3,
  Building2,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon; perm?: Permission };
type Group = { label: string; icon: LucideIcon; items: Item[]; perm?: Permission };
type Entry = Item | Group;

const nav: Entry[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Requests",
    icon: Inbox,
    items: [
      { href: "/admin/leads", label: "All requests", icon: List },
      { href: "/admin/leads/new", label: "New request", icon: PlusCircle, perm: "requests.manage" },
    ],
  },
  {
    label: "Services",
    icon: Wrench,
    perm: "catalog.manage",
    items: [
      { href: "/admin/services", label: "All services", icon: List },
      { href: "/admin/services/new", label: "Add service", icon: PlusCircle },
      { href: "/admin/services?status=draft", label: "Drafts", icon: FileText },
      { href: "/admin/categories", label: "Service categories", icon: FolderTree },
      { href: "/admin/areas", label: "Service areas", icon: MapPin },
    ],
  },
  {
    label: "SEO",
    icon: Search,
    perm: "seo.manage",
    items: [
      { href: "/admin/seo", label: "Page SEO", icon: FileText },
      { href: "/admin/seo/tracking", label: "Analytics & tracking", icon: BarChart3 },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { href: "/admin/settings", label: "Site info", icon: Building2, perm: "settings.manage" },
      { href: "/admin/users", label: "Users & roles", icon: UserCog, perm: "users.manage" },
      { href: "/admin/staff", label: "Staff (crew)", icon: Users, perm: "staff.manage" },
      { href: "/admin/profile", label: "My profile", icon: CircleUser },
    ],
  },
];

const allHrefs = nav.flatMap((e) => ("items" in e ? e.items.map((i) => i.href) : [e.href]));

/** The single most specific link that matches the current path (so /admin/services/new ≠ /admin/services). */
function activeHref(pathname: string | null, search = "") {
  if (!pathname) return null;
  // A link with a query (e.g. Drafts) wins only when the URL has exactly that query.
  const withQuery = allHrefs.find((h) => h.includes("?") && h === pathname + (search ? "?" + search : ""));
  if (withQuery) return withQuery;
  return (
    allHrefs
      .filter((h) => !h.includes("?") && (pathname === h || (h !== "/admin" && pathname.startsWith(h + "/"))))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

const linkBase = "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-[0.92rem] font-medium transition-all duration-200";

function NavItem({ item, active, nested }: { item: Item; active: boolean; nested?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        linkBase,
        nested && "py-1.5 pl-9 text-[0.88rem]",
        active
          ? "bg-brand-gradient text-white shadow-[0_8px_22px_-8px_rgb(37_99_235/0.9)]"
          : "text-white/85 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={nested ? 15 : 17} strokeWidth={1.9} className={active ? "text-white" : "text-brand-400"} />
      {item.label}
    </Link>
  );
}

function NavGroup({ group, current }: { group: Group; current: string | null }) {
  const containsActive = group.items.some((i) => i.href === current);
  const [open, setOpen] = useState(true);
  const Icon = group.icon;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx(linkBase, "mt-1 w-full font-semibold", containsActive ? "text-white" : "text-white/90 hover:bg-white/10 hover:text-white")}
      >
        <Icon size={17} strokeWidth={1.9} className="text-brand-400" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown size={15} className={clsx("transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavItem key={item.href} item={item} active={item.href === current} nested />
          ))}
        </div>
      )}
    </div>
  );
}

/** Menu entries this role may open (groups keep only permitted items). */
function visibleNav(role: string): Entry[] {
  const ok = (p?: Permission) => !p || can(role, p);
  return nav.flatMap<Entry>((e) => {
    if (!("items" in e)) return ok(e.perm) ? [e] : [];
    if (!ok(e.perm)) return [];
    const items = e.items.filter((i) => ok(i.perm));
    return items.length ? [{ ...e, items }] : [];
  });
}

function NavItems({ pathname, search, role }: { pathname: string | null; search?: string; role: string }) {
  const current = activeHref(pathname, search);
  return (
    <>
      {visibleNav(role).map((entry) =>
        "items" in entry ? (
          <NavGroup key={entry.label} group={entry} current={current} />
        ) : (
          <NavItem key={entry.href} item={entry} active={entry.href === current} />
        ),
      )}
      <a href="/" target="_blank" rel="noreferrer" className={clsx(linkBase, "mt-2 text-white/85 hover:bg-white/10 hover:text-white")}>
        <ExternalLink size={17} strokeWidth={1.75} /> View website
      </a>
    </>
  );
}

/** Highlights the current section. Reads the URL, so it renders inside <Suspense>. */
export function AdminNav({ role }: { role: string }) {
  return <NavItems pathname={usePathname()} search={useSearchParams().toString()} role={role} />;
}

/** Same links without highlighting — the Suspense fallback / prerendered shell. */
export function AdminNavFallback() {
  // Shell before the session is read: only links every role can open.
  return <NavItems pathname={null} role="staff" />;
}
