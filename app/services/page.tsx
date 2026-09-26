import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getContent, getPageSeo } from "@/lib/data";
import { PageIntro, EnquiryCTA } from "@/components/layout-parts";
export async function generateMetadata() {
  return getPageSeo(
    "services",
    "Our Services",
    "Social media management, video production, professional photography, reels and design services in Jamshedpur.",
  );
}
export default async function Services() {
  const [services, projects] = await Promise.all([
    getContent("service"),
    getContent("project"),
  ]);
  return (
    <>
      <PageIntro
        label="OUR CREATIVE TOOLKIT"
        title="The vision. The craft. The whole picture."
        description="From strategy to screen, we bring the right mix of thinking and making to your brand. Every scope is shaped around your project."
      />
      <section className="container services-list">
        {services.map((s, i) => (
          <article className="service-detail" id={s.slug} key={s.id}>
            <span className="index">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2>{s.title}</h2>
              <p className="service-tagline">{s.data.description}</p>
              <p>{s.data.brief}</p>
            </div>
            <div>
              <p className="eyebrow">WHAT WE CAN BRING</p>
              <p>{s.data.deliverables}</p>
              <small>
                Exact deliverables and timelines are agreed in your proposal.
              </small>
              {projects
                .filter((p) => p.data.category === s.title)
                .slice(0, 2)
                .map((p) => (
                  <Link
                    className="text-link"
                    key={p.id}
                    href={`/work/${p.slug}`}
                  >
                    {p.title}
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              <Link className="text-link" href="/contact">
                Get a quote <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </section>
      <EnquiryCTA />
    </>
  );
}
