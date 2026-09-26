import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro, Eyebrow, EnquiryCTA } from "@/components/layout-parts";
import { getPageSeo, getBySlug } from "@/lib/data";
export async function generateMetadata() {
  return getPageSeo(
    "about",
    "The Studio",
    "Meet Motion Mark Studio, a creative and digital media studio based in Jamshedpur, Jharkhand.",
  );
}
export default async function About() {
  const page = await getBySlug("page", "about");
  return (
    <>
      <PageIntro
        label="THE STUDIO / OUR POINT OF VIEW"
        title="Thoughtful minds. Restless creativity."
        description="We bring strategy and storytelling into the same room. Then we get to work."
      />
      <section className="container about-story section-space">
        <div className="about-art">
          <span className="brand-icon" />
          <span>IDEAS INTO IMPACT.</span>
        </div>
        <div>
          <Eyebrow>ROOTED IN JAMSHEDPUR</Eyebrow>
          <h2>
            Small details.
            <br />
            <span className="serif">Bigger picture.</span>
          </h2>
          <p className="pre-line">
            {page?.data.description ||
              "Motion Mark Studio brings together digital strategy, film, photography and design. We believe the most meaningful creative work starts with understanding the people behind a brand.\n\nWe’re building a studio where considered ideas meet careful execution, helping businesses, creators and events tell their stories with clarity and character."}
          </p>
          <Link href="/founders" className="text-link">
            The people behind the studio
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section id="process" className="container section-space border-top">
        <Eyebrow>FROM FIRST THOUGHT TO FINAL FRAME</Eyebrow>
        <h2>
          Creativity, with <span className="serif">direction.</span>
        </h2>
        <div className="process-list">
          {[
            [
              "Discovery",
              "We listen to your goals, your audience and what makes your story yours.",
            ],
            [
              "Strategy",
              "We find the message, choose the channels and define what the work needs to do.",
            ],
            [
              "Planning",
              "We align the scope, creative direction, schedule and deliverables.",
            ],
            [
              "Production",
              "We bring the plan to life through considered shoots and design.",
            ],
            [
              "Editing",
              "We shape the footage, refine the details and review the work together.",
            ],
            [
              "Publishing",
              "We prepare the right formats and support a considered rollout.",
            ],
            [
              "Performance review",
              "Where included in the scope, we review response and use what we learn to inform the next chapter.",
            ],
          ].map(([t, d], i) => (
            <div key={t}>
              <span className="index">0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container values section-space border-top">
        <Eyebrow>WHAT WE CARE ABOUT</Eyebrow>
        <div className="content-grid">
          {[
            [
              "Clarity before noise",
              "A good idea should feel clear. We choose purpose over volume.",
            ],
            [
              "Craft in every detail",
              "The frame, the edit, the type. Small decisions shape the whole experience.",
            ],
            [
              "A shared creative process",
              "Open communication and thoughtful collaboration help us make better work together.",
            ],
          ].map(([t, d]) => (
            <article key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
        <p>
          Production requirements and equipment are planned around each brief.
          Contact us to discuss your shoot, format and technical needs.
        </p>
      </section>
      <EnquiryCTA />
    </>
  );
}
