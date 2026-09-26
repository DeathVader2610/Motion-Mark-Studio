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
  return (
    <>
      <LegalPage kind="privacy" />
      <section className="container section-space">
        <h2>Team applications and visitor statistics</h2>
        <p>
          Team applications include your name, email, preferred department,
          portfolio link and experience. Founder Office uses these details to
          review applications and grant studio access.
        </p>
        <p>
          If you allow anonymous statistics, we record public page paths and an
          anonymous browser-tab session identifier hashed separately each day.
          We do not store raw IP addresses, email addresses or URL query strings
          in visit records. These statistics are visible only to Founder Office
          and are retained for up to 90 days. Visits measure sessions, not
          individual people. You can change your choice below; declining does
          not affect website access.
        </p>
        <p>
          Department Drive links open Google Drive, where Google’s policies and
          folder sharing permissions apply. Contact the studio to request
          deletion of an application or employee information.
        </p>
      </section>
    </>
  );
}
