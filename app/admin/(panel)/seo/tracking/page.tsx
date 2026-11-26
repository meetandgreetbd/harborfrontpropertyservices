import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSiteInfo } from "@/lib/data/settings";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { TrackingForm } from "@/components/admin/SiteSettingsForms";

export const metadata = { title: "Analytics & tracking" };

export default function TrackingPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Tracking />
    </Suspense>
  );
}

async function Tracking() {
  await requirePermission("seo.manage");
  const { tracking: t } = await getSiteInfo();
  return (
    <>
      <AdminHeader title="Analytics & tracking" subtitle="Google Analytics, Google Ads, Tag Manager, Meta Pixel, Clarity and search engine verification." />
      <div className="p-6 md:p-10">
        <div className="max-w-3xl">
          <TrackingForm
            values={{
              googleTagIds: t.googleTagIds.join(", "),
              gtmId: t.gtmId,
              metaPixelId: t.metaPixelId,
              clarityId: t.clarityId,
              googleVerification: t.googleVerification,
              bingVerification: t.bingVerification,
            }}
          />
        </div>
      </div>
    </>
  );
}
