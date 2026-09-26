import { getFounders, getPageSeo } from "@/lib/data";
import { PageIntro, EnquiryCTA } from "@/components/layout-parts";
import { FounderGrid } from "@/components/founders";
export async function generateMetadata() {
  return getPageSeo("founders", "Meet the Founders", "Meet Sameer Thripathi and Shrey Ranjan, the co-founders of Motion Mark Studio, and discover their individual creative experience.");
}
export default async function Founders() {
  const founders = await getFounders();
  return <>
    <PageIntro label="THE PEOPLE / THE PERSPECTIVE" title="Meet the founders." description="Two perspectives. One creative vision. Experience built through their individual careers, brought together at Motion Mark Studio." />
    {!!founders.length && <section className="container section-space"><FounderGrid founders={founders} /></section>}
    <EnquiryCTA />
  </>;
}
