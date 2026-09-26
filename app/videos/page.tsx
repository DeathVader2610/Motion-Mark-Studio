import Link from "next/link";
import { Film, ArrowUpRight } from "lucide-react";
import { getContent, getPageSeo } from "@/lib/data";
import { PageIntro, EnquiryCTA } from "@/components/layout-parts";
import { Video } from "@/components/video";
export async function generateMetadata() {
  return getPageSeo(
    "videos",
    "Films & Reels",
    "Brand films, commercials, reels, event films and behind-the-scenes stories from Motion Mark Studio.",
  );
}
export default async function Videos() {
  const videos = await getContent("video");
  return (
    <>
      <PageIntro
        label="THE MOVING PICTURE"
        title="Made to move you."
        description="Brand films. Reels. Moments worth keeping. Our stories, one frame at a time."
      />
      <section className="container section-space">
        {videos.length ? (
          <div className="video-grid">
            {videos
              .toSorted(
                (a, b) => Number(b.data.featured) - Number(a.data.featured),
              )
              .map((v) => (
                <article key={v.id}>
                  <Video
                    url={v.data.video}
                    title={v.title}
                    poster={v.data.image}
                    captions={v.data.captions}
                  />
                  <p className="eyebrow">{v.data.category}</p>
                  <h2>{v.title}</h2>
                  <p>{v.data.description}</p>
                  {v.data.relatedSlug && (
                    <Link
                      className="text-link"
                      href={`/work/${v.data.relatedSlug}`}
                    >
                      Explore the story
                      <ArrowUpRight size={15} />
                    </Link>
                  )}
                </article>
              ))}
          </div>
        ) : (
          <div className="empty-state">
            <Film size={44} strokeWidth={1} />
            <h2>A new reel is coming into focus.</h2>
            <p>
              Our film collection is being prepared. Contact us for samples
              relevant to your project.
            </p>
            <Link href="/contact" className="button">
              Talk film with us
              <ArrowUpRight size={17} />
            </Link>
          </div>
        )}
      </section>
      <EnquiryCTA />
    </>
  );
}
