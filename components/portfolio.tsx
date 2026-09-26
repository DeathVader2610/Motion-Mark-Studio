"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search, Aperture } from "lucide-react";
import type { Content } from "@/lib/schema";
export function ProjectGrid({ projects }: { projects: Content[] }) {
  return (
    <div className="project-grid">
      {projects.map((p) => (
        <Link className="project-card" key={p.id} href={`/work/${p.slug}`}>
          <div className="project-image">
            {p.data.image ? (
              <Image
                src={p.data.image}
                alt={p.title}
                fill
                sizes="(max-width: 700px) 100vw, 50vw"
              />
            ) : (
              <Aperture size={64} strokeWidth={1} />
            )}
            <span className="round-button">
              <ArrowUpRight />
            </span>
          </div>
          <div className="project-caption">
            <h3>{p.title}</h3>
            <span>{p.data.category}</span>
          </div>
          <p>{p.data.client}</p>
        </Link>
      ))}
    </div>
  );
}
export function Portfolio({ projects }: { projects: Content[] }) {
  const [category, setCategory] = useState("All work");
  const [search, setSearch] = useState("");
  const categories = [
    "All work",
    ...new Set(projects.map((p) => p.data.category).filter(Boolean)),
  ];
  const filtered = projects.filter(
    (p) =>
      (category === "All work" || p.data.category === category) &&
      `${p.title} ${p.data.client} ${p.data.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="portfolio-controls">
        <div className="filter-tabs">
          {categories.map((c) => (
            <button
              aria-pressed={category === c}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={16} />
          <span className="sr-only">Search projects</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a story…"
          />
        </label>
      </div>
      {filtered.length ? (
        <ProjectGrid projects={filtered} />
      ) : (
        <div className="empty-state">
          <Aperture size={46} strokeWidth={1} />
          <h2>
            {projects.length
              ? "No matching projects."
              : "Good stories are worth the wait."}
          </h2>
          <p>
            {projects.length
              ? "Try another search or category."
              : "Our portfolio is being curated. Tell us what you have in mind and we’ll share relevant work directly."}
          </p>
          <Link className="button" href="/contact">
            Let’s talk about your project <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
    </>
  );
}
export function ContentCards({ items }: { items: Content[] }) {
  return (
    <div className="content-grid">
      {items.map((p) => (
        <article className="content-card" key={p.id}>
          {p.data.image && (
            <div className="card-image">
              <Image
                src={p.data.image}
                alt={p.title}
                fill
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </div>
          )}
          <p className="eyebrow">{p.data.category}</p>
          <h3>{p.title}</h3>
          <p className="pre-line">{p.data.description}</p>
          {p.data.approach && <p className="pre-line">{p.data.approach}</p>}
          {p.kind === "instagram" && p.data.client && (
            <p>With {p.data.client}</p>
          )}
          {p.kind === "instagram" && p.data.date && (
            <p>{p.data.date.slice(0, 10)}</p>
          )}
          {p.data.url && (
            <a
              className="text-link"
              href={p.data.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {p.kind === "instagram" ? "View on Instagram" : "View profile"}{" "}
              <ArrowUpRight size={16} />
            </a>
          )}
          {p.data.relatedSlug && (
            <Link href={`/work/${p.data.relatedSlug}`} className="text-link">
              Explore project <ArrowUpRight size={16} />
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
