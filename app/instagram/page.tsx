import { Camera as Instagram, ArrowUpRight } from "lucide-react";
import { PageIntro, EnquiryCTA } from "@/components/layout-parts";
import { getContact, getPageSeo } from "@/lib/data";
import { contactLinks } from "@/lib/contact";
import { getInstagram } from "@/lib/instagram";
import { ContentCards } from "@/components/portfolio";
export async function generateMetadata() {
  return getPageSeo(
    "instagram",
    "Instagram Stories",
    "See the latest approved posts, reels and collaborations from Motion Mark Studio.",
  );
}
export default async function InstagramPage() {
  const [feed, contact] = await Promise.all([getInstagram(), getContact()]);
  return (
    <>
      <PageIntro
        label="BETWEEN THE FRAMES"
        title="A closer look at our creative world."
        description="Studio moments, recent stories and creative collaborations, shared from Instagram."
      />
      <section className="container section-space">
        {feed.items.length ? (
          <ContentCards items={feed.items} />
        ) : (
          <div className="empty-state">
            <Instagram size={40} />
            <h2>
              {feed.status === "unavailable"
                ? "The feed is taking a pause."
                : "The next frame is on Instagram."}
            </h2>
            <p>
              {feed.status === "unavailable"
                ? "We couldn’t refresh the feed right now. You can still visit our profile."
                : "Visit our profile for current posts while we prepare selected stories for the site."}
            </p>
          </div>
        )}
        <a
          className="button"
          href={contactLinks(contact).instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          Follow {contact.instagramHandle}
          <ArrowUpRight size={18} />
        </a>
      </section>
      <EnquiryCTA />
    </>
  );
}
