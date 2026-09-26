"use client";
import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
export function Video({
  url,
  title,
  poster = "",
  captions = "",
}: {
  url: string;
  title: string;
  poster?: string;
  captions?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  let embed = "";
  if (["www.youtube.com", "youtube.com"].includes(parsed.hostname)) {
    const id = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id))
      embed = `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (
    parsed.hostname === "youtu.be" &&
    /^[a-zA-Z0-9_-]{11}$/.test(parsed.pathname.slice(1))
  )
    embed = `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
  if (
    ["vimeo.com", "www.vimeo.com"].includes(parsed.hostname) &&
    /^\/\d+$/.test(parsed.pathname)
  )
    embed = `https://player.vimeo.com/video${parsed.pathname}`;
  if (embed)
    return loaded ? (
      <iframe
        className="video-player"
        src={embed}
        title={title}
        loading="lazy"
        allow="fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    ) : (
      <button
        className="video-cover"
        onClick={() => setLoaded(true)}
        aria-label={`Load ${title} from ${parsed.hostname}`}
      >
        {poster && (
          <Image
            src={poster}
            alt=""
            fill
            sizes="(max-width:700px) 100vw, 50vw"
          />
        )}
        <span>
          <Play size={28} />
          Load film<small>Video hosted by {parsed.hostname}</small>
        </span>
      </button>
    );
  if (/\.(mp4|webm)$/i.test(parsed.pathname))
    return (
      <video
        className="video-player"
        src={url}
        poster={poster || undefined}
        controls
        preload="none"
        aria-label={title}
      >
        <track
          kind="captions"
          src={captions || undefined}
          srcLang="en"
          label="English"
          default={!!captions}
        />
      </video>
    );
  return (
    <a
      className="text-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      Watch {title} ↗
    </a>
  );
}
