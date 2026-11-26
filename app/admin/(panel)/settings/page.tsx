import { Suspense } from "react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { smtpConfigured } from "@/lib/email";
import { getSiteInfo, socialNetworks } from "@/lib/data/settings";
import { AdminHeader, AdminLoading } from "@/components/admin/ui";
import { SiteInfoForm } from "@/components/admin/SiteSettingsForms";

export const metadata = { title: "Site info" };

export default function SiteInfoPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <SiteInfo />
    </Suspense>
  );
}

async function SiteInfo() {
  await requirePermission("settings.manage");
  const [info, row] = await Promise.all([getSiteInfo(), db.siteSettings.findUnique({ where: { id: 1 }, select: { notifyEmails: true, lat: true, lng: true } })]);

  return (
    <>
      <AdminHeader title="Site info" subtitle="Business contact details, address, office hours, email notifications and social media links." />
      <div className="p-6 md:p-10">
        <div className="max-w-4xl">
          <SiteInfoForm
            smtpReady={smtpConfigured()}
            networks={socialNetworks}
            values={{
              phone: info.phone,
              email: info.email,
              ...info.address,
              lat: row?.lat == null ? "" : String(row.lat),
              lng: row?.lng == null ? "" : String(row.lng),
              hours: info.hours,
              notifyEmails: row?.notifyEmails ?? "",
              notifyNewRequests: info.notify.newRequests,
              notifyNewBookings: info.notify.newBookings,
              customerConfirmations: info.notify.customerConfirmations,
              social: info.social,
            }}
          />
        </div>
      </div>
    </>
  );
}
