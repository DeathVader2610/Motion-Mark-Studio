import { MessageCircle, ArrowUpRight } from "lucide-react";
import { getContact, getContent, getPageSeo } from "@/lib/data";
import { contactLinks } from "@/lib/contact";
import { PageIntro, Eyebrow } from "@/components/layout-parts";
import { ContactLinks } from "@/components/contact-links";
import { EnquiryForm } from "@/components/enquiry-form";
export async function generateMetadata() {
  return getPageSeo(
    "contact",
    "Start a Project",
    "Talk to Motion Mark Studio about social media, video production, photography and creative projects in Jamshedpur.",
  );
}
export default async function Contact() {
  const [contact, services] = await Promise.all([
    getContact(),
    getContent("service"),
  ]);
  return (
    <>
      <PageIntro
        label="LET’S MAKE SOMETHING MEANINGFUL"
        title="Every great story starts with hello."
        description="An idea, a question, or a brief ready to go. We’d love to hear what you have in mind."
      />
      <section className="container contact-layout section-space">
        <aside>
          <Eyebrow>YOUR NEXT CREATIVE PARTNER</Eyebrow>
          <h2>
            Let’s get
            <br />
            <span className="serif">the ball rolling.</span>
          </h2>
          <ContactLinks contact={contact} />
          <div className="contact-location">
            <span className="eyebrow">BASED IN</span>
            <p>{contact.location}</p>
            {contact.hours && <p>{contact.hours}</p>}
          </div>
          <a
            className="button secondary"
            href={contactLinks(contact).whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} />
            Chat on WhatsApp
            <ArrowUpRight size={16} />
          </a>
        </aside>
        <EnquiryForm services={services.map((s) => s.title)} />
      </section>
    </>
  );
}
