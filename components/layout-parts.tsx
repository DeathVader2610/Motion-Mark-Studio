import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { getContact } from "@/lib/data";
import { ContactLinks } from "./contact-links";
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span className="tiny-square" />
      {children}
    </p>
  );
}
export function PageIntro({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-intro container">
      <Eyebrow>{label}</Eyebrow>
      <h1>{title}</h1>
      <p className="intro-copy">{description}</p>
    </section>
  );
}
export async function EnquiryCTA() {
  const contact = await getContact();
  return (
    <section className="enquiry-cta container">
      <Eyebrow>GOOD THINGS START WITH A CONVERSATION</Eyebrow>
      <div className="cta-row">
        <h2>
          Have a story?
          <br />
          <span className="serif">Let’s make it move.</span>
        </h2>
        <Link
          href="/contact"
          className="circle-link"
          aria-label="Start a project"
        >
          <ArrowUpRight size={44} />
        </Link>
      </div>
      <ContactLinks contact={contact} compact />
    </section>
  );
}
export async function Footer() {
  const contact = await getContact();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="footer-brand">
            MOTION MARK
            <br />
            <span>STUDIO.</span>
          </Link>
          <p>
            Stories in motion.
            <br />
            Brands that leave a mark.
          </p>
          <p className="location">{contact.location}</p>
        </div>
        <div>
          <p className="eyebrow">EXPLORE</p>
          <div className="footer-nav">
            {[
              ["Our work", "/work"],
              ["Services", "/services"],
              ["The studio", "/about"],
              ["Our founders", "/founders"],
              ["Collaborations", "/collaborations"],
              ["Films & reels", "/videos"],
              ["Instagram", "/instagram"],
              ["Start a project", "/contact"],
            ].map(([label, url]) => (
              <Link key={url} href={url}>
                {label}
                <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow">KEEP IN TOUCH</p>
          <ContactLinks contact={contact} />
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Motion Mark Studio</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/admin">Studio login</Link>
        </div>
        <span>Made for a lasting impression.</span>
      </div>
    </footer>
  );
}
