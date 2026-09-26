import { LegalPage } from "@/components/legal-page";
import { getPageSeo } from "@/lib/data";
export async function generateMetadata() {
  return getPageSeo(
    "privacy",
    "Privacy Policy",
    "How Motion Mark Studio handles website enquiries and contact information.",
  );
}
export default function Privacy() {
  return <LegalPage kind="privacy" />;
}
