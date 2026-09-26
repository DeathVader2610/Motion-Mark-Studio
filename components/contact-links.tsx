import { ArrowUpRight, Phone, Mail, Camera as Instagram } from "lucide-react";
import { contactLinks, type Contact } from "@/lib/contact";
export function ContactLinks({
  contact,
  compact = false,
}: {
  contact: Contact;
  compact?: boolean;
}) {
  const links = contactLinks(contact);
  return (
    <div className={compact ? "contact-links compact" : "contact-links"}>
      <a href={links.email}>
        <Mail size={16} />
        <span>{contact.email}</span>
        <ArrowUpRight size={16} />
      </a>
      <a href={links.phone}>
        <Phone size={16} />
        <span>{contact.phone}</span>
        <ArrowUpRight size={16} />
      </a>
      <a href={links.instagram} target="_blank" rel="noopener noreferrer">
        <Instagram size={16} />
        <span>{contact.instagramHandle}</span>
        <ArrowUpRight size={16} />
      </a>
    </div>
  );
}
