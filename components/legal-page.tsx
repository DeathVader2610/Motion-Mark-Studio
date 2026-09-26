import { getBySlug, getContact } from "@/lib/data";
import { PageIntro } from "./layout-parts";
import { contactLinks } from "@/lib/contact";
export async function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const [page, contact] = await Promise.all([
    getBySlug("page", kind),
    getContact(),
  ]);
  return (
    <>
      <PageIntro
        label="THE DETAILS"
        title={kind === "privacy" ? "Privacy policy." : "Terms & conditions."}
        description="Clear information about using this website and getting in touch."
      />
      <article className="container legal-copy section-space">
        <p className="notice">
          Draft for professional legal review. This content should be reviewed
          and approved before public launch.
        </p>
        {page ? (
          <div className="pre-line">{page.data.description}</div>
        ) : kind === "privacy" ? (
          <>
            <h2>When you contact us</h2>
            <p>
              The enquiry form collects your contact details, project
              information, consent and any optional brief you upload. We use
              that information to respond to your request, review your project
              and keep a record of our conversation.
            </p>
            <h2>Service providers</h2>
            <p>
              The website uses server-side database storage and an email service
              to process enquiries. If configured, Cloudflare Turnstile helps
              protect forms from spam. Embedded videos and external profile
              links may use services with their own privacy policies.
            </p>
            <h2>Storage and preferences</h2>
            <p>
              Your theme preference is stored in your browser. Administrator
              sessions use essential cookies. Optional anonymous visitor statistics are described below. No advertising cookies are used.
            </p>
            <h2>Your information</h2>
            <p>
              For questions about your information, or to request a correction
              or deletion, contact the studio. A retention schedule and
              applicable rights process must be finalised before launch.
            </p>
          </>
        ) : (
          <>
            <h2>Using this website</h2>
            <p>
              This website introduces Motion Mark Studio and its creative
              services. Service descriptions are an invitation to discuss a
              project. Sending an enquiry does not create a service agreement or
              confirm availability.
            </p>
            <h2>Project agreements</h2>
            <p>
              Scope, deliverables, pricing, timelines, usage rights, payment
              terms, revisions and cancellation arrangements will be set out in
              a separate written proposal or agreement.
            </p>
            <h2>Creative work</h2>
            <p>
              Project imagery and other materials may belong to the studio, its
              clients or their respective creators. Contact the studio before
              reusing material from this website.
            </p>
            <h2>External services</h2>
            <p>
              External websites and platforms operate under their own terms.
              Further terms, applicable law and dispute provisions require
              professional review before publication.
            </p>
          </>
        )}
        <h2>Contact</h2>
        <a className="text-link" href={contactLinks(contact).email}>
          {contact.email}
        </a>
      </article>
    </>
  );
}
