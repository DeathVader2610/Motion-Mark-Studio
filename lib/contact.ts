import { z } from "zod";
export const contactSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^\+[1-9][\d ()-]{7,22}$/,
      "Use an international number beginning with +",
    )
    .refine(
      (value) => /^\+[1-9]\d{7,14}$/.test(value.replace(/[ ()-]/g, "")),
      "Use 8–15 digits including the country code",
    ),
  email: z.string().trim().email().max(254),
  instagramHandle: z
    .string()
    .trim()
    .regex(/^@[a-zA-Z0-9._]{1,30}$/),
  location: z.string().trim().min(2).max(150),
  hours: z.string().trim().max(150).default(""),
});
export type Contact = z.infer<typeof contactSchema>;
export const officialContact: Contact = {
  phone: "+91 9546960044",
  email: "motionmarkstudio1@gmail.com",
  instagramHandle: "@motionmark.studio",
  location: "Jamshedpur, Jharkhand, India",
  hours: "",
};
export function contactLinks(contact: Contact) {
  const digits = contact.phone.replace(/\D/g, "");
  return {
    phone: `tel:+${digits}`,
    email: `mailto:${contact.email}`,
    whatsapp: `https://wa.me/${digits}`,
    instagram: `https://www.instagram.com/${contact.instagramHandle.slice(1)}/`,
  };
}
