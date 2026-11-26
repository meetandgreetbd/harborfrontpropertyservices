import type { Metadata } from "next";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Tracking } from "@/components/seo/Tracking";
import { getSiteInfo } from "@/lib/data/settings";

/** Search Console / Bing verification meta tags from Admin → SEO → Analytics & tracking. */
export async function generateMetadata(): Promise<Metadata> {
  const { tracking: t } = await getSiteInfo();
  if (!t.googleVerification && !t.bingVerification) return {};
  return {
    verification: {
      ...(t.googleVerification ? { google: t.googleVerification } : {}),
      ...(t.bingVerification ? { other: { "msvalidate.01": t.bingVerification } } : {}),
    },
  };
}

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteChrome>{children}</SiteChrome>
      <Tracking />
    </>
  );
}
