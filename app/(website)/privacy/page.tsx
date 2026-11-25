import { site } from "@/lib/site";
import { seoFor } from "@/lib/seo";
import { PageHeader } from "@/components/sections/PageHeader";

export function generateMetadata() {
  return seoFor("/privacy");
}

export default function PrivacyPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Privacy", path: "/privacy" }]} title="Privacy policy" />
      {/* TODO(owner): have this reviewed before launch. */}
      <div className="container-x py-16">
        <div className="prose-body space-y-4">
          <p>
            When you send a quote request or work order, we collect your name, email, phone number, property address and
            the details you provide. We use this only to respond to you and to carry out the work.
          </p>
          <p>We don&apos;t sell or share your information with third parties for marketing.</p>
          <p>
            This site uses analytics to understand how visitors use it. You can block these cookies in your browser
            settings.
          </p>
          <p>
            To ask what information we hold about you, or to have it deleted, email{" "}
            <a href={`mailto:${site.email}`} className="text-night underline">
              {site.email}
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
