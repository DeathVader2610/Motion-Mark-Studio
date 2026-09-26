import { getContent, getPageSeo } from "@/lib/data";
import { PageIntro, EnquiryCTA } from "@/components/layout-parts";
import { Portfolio } from "@/components/portfolio";
export async function generateMetadata() {
  return getPageSeo(
    "work",
    "Our Work",
    "Films, photographs, campaigns and social stories by Motion Mark Studio. Explore our creative work.",
  );
}
export default async function Work() {
  return (
    <>
      <PageIntro
        label="THE WORK / THE STORIES"
        title="A little strategy. A lot of soul."
        description="A collection of ideas brought to life through film, photography, design and digital storytelling."
      />
      <section className="container section-space">
        <Portfolio projects={await getContent("project")} />
      </section>
      <EnquiryCTA />
    </>
  );
}
