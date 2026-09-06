import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/mark";
import { AuthSlot } from "@/components/auth-slot";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const links = [
  { href: "#generate", label: "Generate" },
  { href: "#tour", label: "Tour" },
  { href: "#mentors", label: "Mentors" },
  { href: "#journey", label: "HoloTimeline" },
  { href: "#pathways", label: "Pathways" },
];

export function Nav() {
  const menuOpen = useAppStore((s) => s.menuOpen);
  const setMenuOpen = useAppStore((s) => s.setMenuOpen);
  const setLucienOpen = useAppStore((s) => s.setLucienOpen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "nav-safe fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-fast",
          scrolled ? "border-b border-line/80 bg-bg/80" : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
          <Link to="/" hash="field" className="text-fg" aria-label="OnlyBrains home">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {links.map((l) => (
              <a
                key={l.href}
                href={`/${l.href}`}
                className="text-sm text-muted transition-colors duration-150 hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AuthSlot />
            <Button
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setLucienOpen(true)}
            >
              Speak with Lucien
            </Button>
            <button
              type="button"
              className="relative grid size-11 place-items-center text-fg md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-30 overflow-y-auto bg-bg/95 px-6 pt-24 pb-10 transition-opacity duration-fast md:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <nav className="flex flex-col gap-2" aria-label="Mobile">
          {links.map((l) => (
            <a
              key={l.href}
              href={`/${l.href}`}
              onClick={() => setMenuOpen(false)}
              className="font-display py-3 text-4xl italic"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="font-display py-3 text-4xl italic"
          >
            Sign in
          </Link>
          <Button
            size="lg"
            className="mt-6"
            onClick={() => {
              setMenuOpen(false);
              setLucienOpen(true);
            }}
          >
            Speak with Lucien
          </Button>
        </nav>
      </div>
    </>
  );
}
