import { LegalPage } from "@/components/legal-page";
import { getPageSeo } from "@/lib/data";
export async function generateMetadata() {
  return getPageSeo(
    "terms",
    "Terms & Conditions",
    "Terms for using the Motion Mark Studio website and making a project enquiry.",
  );
}
export default function Terms() {
  return <LegalPage kind="terms" />;
}
