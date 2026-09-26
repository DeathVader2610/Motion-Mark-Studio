"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X, Sun, Moon } from "lucide-react";
const links = [
  ["Work", "/work"],
  ["Services", "/services"],
  ["About", "/about"],
  ["Contact", "/contact"],
];
function readTheme() {
  try {
    const value = localStorage.getItem("mm-theme");
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}
export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => {
    const saved = readTheme();
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const apply = (t: string) => {
      document.documentElement.dataset.theme = t;
      setTheme(t);
    };
    apply(saved || (dark.matches ? "dark" : "light"));
    const change = () => {
      if (!readTheme()) apply(dark.matches ? "dark" : "light");
    };
    dark.addEventListener("change", change);
    return () => dark.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("mm-theme", next);
    } catch {
      /* Theme still works when browser storage is blocked. */
    }
  }
  return (
    <header className="site-header">
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="wordmark"
        aria-label="Motion Mark Studio home"
      >
        <span className="brand-icon" aria-hidden="true" />
        <span>
          MOTION MARK<span className="wordmark-studio">STUDIO.</span>
        </span>
      </Link>
      <nav aria-label="Main navigation" className="desktop-nav">
        {links.map(([label, url]) => (
          <Link
            className={pathname === url ? "active" : ""}
            key={url}
            href={url}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="nav-actions">
        <button
          onClick={toggle}
          className="icon-button"
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link href="/contact" className="button small nav-cta">
          Let’s talk <ArrowUpRight size={15} />
        </Link>
        <button
          className="icon-button mobile-menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile navigation">
          {links.map(([label, url]) => (
            <Link onClick={() => setOpen(false)} key={url} href={url}>
              {label}
              <ArrowUpRight />
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
