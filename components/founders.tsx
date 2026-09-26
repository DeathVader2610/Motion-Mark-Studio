import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getFounders } from "@/lib/data";
import { instagramProfile } from "@/lib/founders";
import type { Content } from "@/lib/schema";
import { Reveal } from "./reveal";
import { Eyebrow } from "./layout-parts";

export function FounderGrid({ founders, headingLevel = "h2" }: { founders: Content[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return <div className="founders-grid">
    {founders.map(founder => {
      const instagram = instagramProfile(founder.data.url);
      return <Reveal key={founder.id} className="founder-reveal">
        <article className="founder-card">
          <div className="founder-portrait">
            {founder.data.image ? <Image src={founder.data.image} alt={founder.data.imageAlt || founder.title} fill sizes="(max-width: 700px) 90vw, (max-width: 1200px) 44vw, 530px" style={{ objectPosition: founder.data.portraitPosition || "top" }} /> : <span>Portrait forthcoming</span>}
          </div>
          <div className="founder-details">
            <Heading>{founder.title}</Heading>
            <p className="founder-role">{founder.data.category}</p>
            {!!founder.data.highlights?.length && <ul className="founder-highlights" aria-label={`${founder.title}’s individual experience and community`}>
              {founder.data.highlights.map((highlight, i) => <li key={i}>{highlight}</li>)}
            </ul>}
            <p className="founder-bio">{founder.data.description}</p>
            {instagram && <a className="text-link founder-instagram" href={instagram} target="_blank" rel="noopener noreferrer" aria-label={`${founder.title} on Instagram (opens in a new tab)`}>Instagram <ArrowUpRight size={17} aria-hidden="true" /></a>}
          </div>
        </article>
      </Reveal>;
    })}
  </div>;
}
export async function MeetFounders() {
  const founders = await getFounders();
  if (!founders.length) return null;
  return <section className="container section-space border-top" aria-labelledby="meet-founders">
    <div className="founders-intro">
      <Eyebrow>THE PEOPLE BEHIND THE PICTURE</Eyebrow>
      <h2 id="meet-founders">Meet the <span className="serif">founders.</span></h2>
      <p>Two perspectives. One creative vision. Experience built through their individual careers, brought together at Motion Mark Studio.</p>
    </div>
    <FounderGrid founders={founders} headingLevel="h3" />
  </section>;
}
