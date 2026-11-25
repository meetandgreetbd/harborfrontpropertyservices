"use client";

import { useState } from "react";
import clsx from "clsx";
import { CalendarCheck, FileText } from "lucide-react";

/** Service-page sidebar: "Book a time" (live slots) or "Get a quote" (form), as two tabs. */
export function BookOrQuote({ booking, quote, defaultTab = "book" }: { booking: React.ReactNode; quote: React.ReactNode; defaultTab?: "book" | "quote" }) {
  const [tab, setTab] = useState<"book" | "quote">(defaultTab);
  const tabs = [
    { id: "book" as const, label: "Book a time", icon: CalendarCheck },
    { id: "quote" as const, label: "Get a quote", icon: FileText },
  ];
  return (
    <div>
      <div role="tablist" aria-label="Book or get a quote" className="grid grid-cols-2 gap-1 rounded-full bg-canvas-2 p-1 ring-1 ring-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[0.9rem] font-semibold transition-all",
              tab === t.id ? "bg-brand-gradient text-white shadow-md shadow-brand/30" : "text-muted hover:text-night",
            )}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5" role="tabpanel">
        {/* Keep both mounted so typed values survive switching tabs */}
        <div className={tab === "book" ? "" : "hidden"}>{booking}</div>
        <div className={tab === "quote" ? "" : "hidden"}>{quote}</div>
      </div>
    </div>
  );
}
