import Image from "next/image";
import { notFound } from "next/navigation";
import { getBySlug, getContent } from "@/lib/data";
import { PageIntro, EnquiryCTA } from "@/components/layout-parts";
import { ProjectGrid } from "@/components/portfolio";
import { Video } from "@/components/video";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getBySlug("project", slug);
  return {
    title: p?.data.seoTitle || p?.title || "Project not found",
    description: p?.data.seoDescription || p?.data.description,
    alternates: { canonical: `/work/${slug}` },
  };
}
export default async function Project({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getBySlug("project", slug);
  if (!p) notFound();
  const related = (await getContent("project"))
    .filter((r) => r.id !== p.id && r.data.category === p.data.category)
    .slice(0, 2);
  return (
    <>
      <PageIntro
        label={p.data.category || "A STUDIO STORY"}
        title={p.title}
        description={p.data.description}
      />
      <article className="container case-study">
        <p className="eyebrow">{p.data.client}</p>
        {p.data.image && (
          <Image
            className="case-cover"
            src={p.data.image}
            alt={p.title}
            width={1400}
            height={900}
            sizes="100vw"
          />
        )}
        {[
          ["The brief", p.data.brief],
          ["The challenge", p.data.challenge],
          ["Our approach", p.data.approach],
          ["The deliverables", p.data.deliverables],
          ["The outcome", p.data.outcome],
        ].map(
          ([t, d]) =>
            d && (
              <section className="case-section" key={t}>
                <h2>{t}</h2>
                <p className="pre-line">{d}</p>
              </section>
            ),
        )}
        {p.data.video && (
          <Video
            url={p.data.video}
            title={p.title}
            poster={p.data.image}
            captions={p.data.captions}
          />
        )}
        <div className="project-grid">
          {p.data.gallery?.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${p.title} — project image ${i + 1}`}
              width={800}
              height={600}
              sizes="(max-width:700px) 100vw, 50vw"
            />
          ))}
        </div>
        {p.data.url && (
          <a
            href={p.data.url}
            className="text-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            View the collaboration ↗
          </a>
        )}
        {related.length > 0 && (
          <section className="section-space">
            <h2>More stories.</h2>
            <ProjectGrid projects={related} />
          </section>
        )}
      </article>
      <EnquiryCTA />
    </>
  );
}
