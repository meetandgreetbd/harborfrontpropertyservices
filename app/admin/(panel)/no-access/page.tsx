import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "No access" };

export default function NoAccessPage() {
  return (
    <div className="flex flex-col items-start gap-4 p-6 md:p-10">
      <ShieldAlert size={36} className="text-amber-700" />
      <h1 className="font-sans text-[1.5rem] font-semibold text-night">You don&apos;t have access to this page</h1>
      <p className="max-w-lg text-muted">Your role doesn&apos;t include this section. If you need it, ask an Admin to change your role under Users &amp; roles.</p>
      <Link href="/admin" className="rounded-[3px] bg-night px-4 py-2 text-[0.9rem] text-canvas hover:bg-night-600">
        Back to dashboard
      </Link>
    </div>
  );
}
