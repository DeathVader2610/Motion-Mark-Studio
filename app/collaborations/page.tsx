import { getContent, getPageSeo } from "@/lib/data";
import { PageIntro, EnquiryCTA } from "@/components/layout-parts";
import { ContentCards, ProjectGrid } from "@/components/portfolio";
export async function generateMetadata() {
  return getPageSeo(
    "collaborations",
    "Clients & Collaborations",
    "Creative partnerships with businesses, brands and creators. Explore Motion Mark Studio collaborations.",
  );
}
export default async function Collaborations() {
  const [clients, collaborators, projects] = await Promise.all([
    getContent("client"),
    getContent("collaborator"),
    getContent("project"),
  ]);
  return (
    <>
      <PageIntro
        label="BETTER, TOGETHER"
        title="Good work starts with good people."
        description="Businesses, brands and creators. Different perspectives brought together by a shared creative ambition."
      />
      <section className="container section-space">
        <h2>Businesses & brands.</h2>
        {clients.length ? (
          <ContentCards items={clients} />
        ) : (
          <p className="empty-copy">
            Client profiles will appear here once approved for publication.
          </p>
        )}
        <h2>Creators & collaborators.</h2>
        {collaborators.length ? (
          <ContentCards items={collaborators} />
        ) : (
          <p className="empty-copy">
            Our creator collaborations are being prepared for the site.
          </p>
        )}
        {projects.some((p) => p.data.featured) && (
          <>
            <h2>Featured stories.</h2>
            <ProjectGrid projects={projects.filter((p) => p.data.featured)} />
          </>
        )}
      </section>
      <EnquiryCTA />
    </>
  );
}
