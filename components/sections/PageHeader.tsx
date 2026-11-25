import { Breadcrumbs, type Crumb } from "@/components/seo/Breadcrumbs";

/** Inner-page header: dark band with blueprint grid and a slow blue glow. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]" />
      <div aria-hidden="true" className="animate-glow absolute -right-32 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand/40 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan/20 blur-3xl" />
      <div className="container-x pb-16 pt-8 md:pb-20">
        <div className="[&_a]:text-white/60 [&_a:hover]:text-white [&_nav]:text-white/50 [&_span]:text-white/70">
          <Breadcrumbs items={crumbs} />
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="animate-fade-up md:col-span-8">
            {eyebrow && <p className="eyebrow text-brand-400">{eyebrow}</p>}
            <h1 className="mt-4 text-[clamp(2.2rem,1.4rem+3vw,3.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">{title}</h1>
          </div>
          {lead && (
            <div className="animate-fade-up text-[1.05rem] leading-relaxed text-white/70 [animation-delay:120ms] md:col-span-4 md:pb-2">
              {lead}
            </div>
          )}
        </div>
        {children && <div className="animate-fade-up [animation-delay:200ms]">{children}</div>}
      </div>
    </section>
  );
}
