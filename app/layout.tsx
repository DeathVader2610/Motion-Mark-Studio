import { PublicChrome, VisitConsent } from "@/components/site-chrome";
import { siteOrigin } from "@/lib/site-url";
import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/layout-parts";
import { getContact } from "@/lib/data";
import { contactLinks } from "@/lib/contact";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Motion Mark Studio · Stories in Motion",
    template: "%s · Motion Mark Studio",
  },
  description:
    "Independent digital media studio in Jamshedpur. Social media, film, photography and thoughtful creative work for brands and creators.",
  openGraph: {
    type: "website",
    siteName: "Motion Mark Studio",
    images: ["/opengraph-image"],
  },
  twitter: { card: "summary_large_image" },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contact = await getContact();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Motion Mark Studio",
    email: contact.email,
    telephone: contact.phone,
    sameAs: [contactLinks(contact).instagram],
    address: contact.location,
    url: siteOrigin(),
  };
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('mm-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch{}`,
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <PublicChrome>
          <Navigation />
        </PublicChrome>
        <main id="main">{children}</main>
        <PublicChrome>
          <Footer />
        </PublicChrome>
        <VisitConsent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
