import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Property Maintenance & Repairs`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1c",
};

/**
 * Dev only: some browser extensions (security / VPN add-ons) stamp attributes such as
 * `bis_skin_checked`, `bis_register` and `__processed_…__` onto every element before React
 * hydrates, which floods the dev overlay with hydration-mismatch warnings. This strips them
 * until the page has hydrated. Production never reports attribute mismatches, so it isn't shipped.
 */
const stripExtensionAttrs = `(function(){
  var bad = function(n){ return n.indexOf('bis_') === 0 || /^__processed_.*__$/.test(n); };
  var clean = function(el){ if (!el || !el.attributes) return; for (var i = el.attributes.length - 1; i >= 0; i--) { var n = el.attributes[i].name; if (bad(n)) el.removeAttribute(n); } };
  var mo = new MutationObserver(function(list){ list.forEach(function(m){
    if (m.type === 'attributes' && m.attributeName && bad(m.attributeName)) m.target.removeAttribute(m.attributeName);
    m.addedNodes && m.addedNodes.forEach(function(n){ if (n.nodeType === 1) { clean(n); n.querySelectorAll && n.querySelectorAll('*').forEach(clean); } });
  }); });
  var sweep = function(){ clean(document.documentElement); document.querySelectorAll('*').forEach(clean); };
  sweep();
  mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', sweep);
  window.addEventListener('load', function(){ setTimeout(function(){ mo.disconnect(); }, 4000); });
})();`;

/** Root shell only: fonts + <html>/<body>. Public chrome lives in app/(website)/layout.tsx, admin chrome in app/admin. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: extensions also edit <html>/<body> attributes directly
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      {process.env.NODE_ENV === "development" && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: stripExtensionAttrs }} />
        </head>
      )}
      <body className="flex min-h-dvh flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
