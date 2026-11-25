import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileCallBar } from "./MobileCallBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { localBusinessSchema } from "@/lib/schema";
import { getPublishedAreas } from "@/lib/data/catalog";

/** Public website frame: skip link, header, footer, mobile call bar, LocalBusiness schema. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Without JavaScript, scroll-reveal content must still be visible. */}
      <noscript>
        <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-night focus:px-4 focus:py-2 focus:text-canvas"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileCallBar />
      <BusinessSchema />
    </>
  );
}

async function BusinessSchema() {
  return <JsonLd data={localBusinessSchema(await getPublishedAreas())} />;
}
