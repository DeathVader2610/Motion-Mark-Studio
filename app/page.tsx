import { MeetFounders } from "@/components/founders";
import Link from "next/link";
import { getInstagram } from "@/lib/instagram";
import { ArrowUpRight, ArrowDown, Aperture, Play } from "lucide-react";
import { getContent, getPageSeo, getContact } from "@/lib/data";
import { contactLinks } from "@/lib/contact";
import { Eyebrow, EnquiryCTA } from "@/components/layout-parts";
import { Reveal } from "@/components/reveal";
import { ProjectGrid, ContentCards } from "@/components/portfolio";
export async function generateMetadata() {
  return getPageSeo(
    "home",
    "Stories in Motion",
    "Motion Mark Studio — social media, video production and photography in Jamshedpur. Thoughtful creative work for brands and creators.",
  );
}
export default async function Home() {
  const [
    projects,
    services,
    clients,
    testimonials,
    stats,
    videos,
    contact,
    collaborators,
    instagram,
  ] = await Promise.all([
    getContent("project"),
    getContent("service"),
    getContent("client"),
    getContent("testimonial"),
    getContent("stat"),
    getContent("video"),
    getContact(),
    getContent("collaborator"),
    getInstagram(),
  ]);
  const selected = projects.filter((p) => p.data.featured);
  const showreel = videos.find((v) => v.data.featured);
  return (
    <>
      <section className="hero container">
        <div className="hero-top">
          <Eyebrow>INDEPENDENT CREATIVE STUDIO</Eyebrow>
          <span className="hero-location">
            JAMSHEDPUR, INDIA <span className="status-dot" />
          </span>
        </div>
        <div className="hero-title">
          <h1>
            Stories in <span className="serif">motion.</span>
            <br />
            Brands that leave
            <br />a <span className="outlined">mark.</span>
            <span className="hero-asterisk" aria-hidden="true">
              ✳
            </span>
          </h1>
          <div className="hero-aside">
            <p>
              We turn ideas into
              <br />
              images, stories into films,
              <br />
              and brands into a feeling.
            </p>
            <Link href="/contact" className="button">
              Start a project <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="cinema-frame">
          <div className="frame-corner tl" />
          <div className="frame-corner tr" />
          <div className="frame-corner bl" />
          <div className="frame-corner br" />
          <span className="frame-label">
            <span className="status-dot" /> MOTION MARK ORIGINALS
          </span>
          <div className="cinema-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <span className="cinema-mark" />
            <span className="cinema-word">MAKE YOUR MARK.</span>
          </div>
          <div className="film-bottom">
            <span>STRATEGY. STORY. STUDIO.</span>
            <Link href={showreel ? "/videos" : "/work"} className="film-link">
              {showreel ? <Play size={14} /> : <Aperture size={17} />}{" "}
              {showreel ? "Watch our showreel" : "Inside our creative world"}
              <ArrowUpRight size={16} />
            </Link>
            <span>EST. IN JAMSHEDPUR</span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>THOUGHTFULLY MADE. DISTINCTLY YOU.</span>
          <a href="#studio">
            SCROLL TO EXPLORE <ArrowDown size={14} />
          </a>
        </div>
      </section>
      <div className="discipline-strip" aria-label="Our disciplines">
        <span>STRATEGY</span>
        <span>✳</span>
        <span>FILM</span>
        <span>✳</span>
        <span>PHOTOGRAPHY</span>
        <span>✳</span>
        <span>SOCIAL</span>
        <span>✳</span>
        <span>DESIGN</span>
        <span>✳</span>
      </div>
      <Reveal>
        <section id="studio" className="container studio-intro section-space">
          <Eyebrow>01 / A LITTLE ABOUT US</Eyebrow>
          <div>
            <h2>
              More than content.
              <br />A <span className="serif">point of view.</span>
            </h2>
            <div className="intro-bottom">
              <p>
                We’re Motion Mark Studio, a creative team in Jamshedpur bringing
                strategy, production and design together. From the first idea to
                the final frame, we help brands show up with intention.
              </p>
              <Link href="/about" className="text-link">
                Meet the studio <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
      <section className="container section-space border-top">
        <div className="section-heading">
          <div>
            <Eyebrow>02 / WHAT WE DO</Eyebrow>
            <h2>
              Creative, from
              <br />
              <span className="serif">every angle.</span>
            </h2>
          </div>
          <p>
            One studio. A complete creative toolkit.
            <br />
            Built around what your brand needs.
          </p>
        </div>
        <div className="service-overview">
          {services
            .filter((_, i) => [0, 3, 6, 7, 12, 14].includes(i))
            .map((service, i) => (
              <Link href={`/services#${service.slug}`} key={service.id}>
                <span className="index">0{i + 1}</span>
                <h3>{service.title}</h3>
                <ArrowUpRight size={26} />
              </Link>
            ))}
        </div>
        <Link className="text-link" href="/services">
          Explore all services <ArrowUpRight size={17} />
        </Link>
      </section>
      <Reveal>
        <section className="container section-space border-top">
          <div className="section-heading">
            <div>
              <Eyebrow>03 / OUR WORK</Eyebrow>
              <h2>
                Made with intent.
                <br />
                <span className="serif">Built to be felt.</span>
              </h2>
            </div>
            <Link href="/work" className="text-link">
              Explore our work <ArrowUpRight size={17} />
            </Link>
          </div>
          {selected.length ? (
            <ProjectGrid projects={selected.slice(0, 4)} />
          ) : (
            <div className="work-invitation">
              <Aperture size={50} strokeWidth={1} />
              <div>
                <p className="eyebrow">A NEW CHAPTER IS TAKING SHAPE</p>
                <h3>Your next story could start here.</h3>
                <p>
                  Our selected work is being prepared for the site.
                  <br />
                  Get in touch to discuss relevant samples for your project.
                </p>
              </div>
              <Link
                href="/contact"
                className="round-button"
                aria-label="Ask about our work"
              >
                <ArrowUpRight />
              </Link>
            </div>
          )}
        </section>
      </Reveal>
      {clients.length > 0 && (
        <section className="container section-space border-top">
          <Eyebrow>IN GOOD COMPANY</Eyebrow>
          <h2>Brands we’ve worked with.</h2>
          <ContentCards items={clients} />
        </section>
      )}
      {collaborators.length > 0 && (
        <section className="container section-space border-top">
          <Eyebrow>CREATORS / COLLABORATORS</Eyebrow>
          <h2>Creative minds, together.</h2>
          <ContentCards items={collaborators.slice(0, 3)} />
        </section>
      )}
      <section className="process-band">
        <div className="container">
          <Eyebrow>THE WAY WE WORK</Eyebrow>
          <div className="section-heading">
            <h2>
              A clear idea.
              <br />A <span className="serif">considered process.</span>
            </h2>
            <Link className="text-link" href="/about#process">
              Discover our approach <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="process-preview">
            {[
              [
                "01",
                "Find the story",
                "We listen, ask questions and get to know your world.",
              ],
              [
                "02",
                "Shape the vision",
                "Strategy and creative direction give every detail a purpose.",
              ],
              [
                "03",
                "Make it matter",
                "We produce, refine and deliver work that feels like you.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {stats.length > 0 && (
        <section className="container stat-grid section-space">
          {stats.map((s) => (
            <div key={s.id}>
              <strong>{s.title}</strong>
              <p>{s.data.description}</p>
            </div>
          ))}
        </section>
      )}
      {testimonials.length > 0 && (
        <section className="container section-space">
          <Eyebrow>IN THEIR WORDS</Eyebrow>
          {testimonials.map((t) => (
            <blockquote key={t.id}>
              <p>“{t.data.description}”</p>
              <cite>{t.title}</cite>
            </blockquote>
          ))}
        </section>
      )}
      <MeetFounders />
      <section className="container instagram-band">
        <div>
          <Eyebrow>BETWEEN THE FRAMES</Eyebrow>
          <h3>The studio, in real time.</h3>
        </div>
        <a
          className="text-link"
          href={contactLinks(contact).instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          {contact.instagramHandle}
          <ArrowUpRight size={19} />
        </a>
      </section>
      {instagram.items.length > 0 && (
        <section className="container section-space">
          <Eyebrow>RECENT INSTAGRAM STORIES</Eyebrow>
          <ContentCards items={instagram.items.slice(0, 3)} />
        </section>
      )}
      <EnquiryCTA />
    </>
  );
}
