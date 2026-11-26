import { getSiteInfo } from "@/lib/data/settings";

/** Business phone / email from Admin → Settings → Site info (cached; updates when saved). */
export async function PhoneText() {
  return <>{(await getSiteInfo()).phone}</>;
}

export async function PhoneLink({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { phone, phoneHref } = await getSiteInfo();
  return (
    <a href={phoneHref} className={className}>
      {children ?? phone}
    </a>
  );
}

export async function EmailLink({ className }: { className?: string }) {
  const { email } = await getSiteInfo();
  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  );
}
