import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/nav";
import { Walkthrough } from "@/components/walkthrough";
import { SiteFooter } from "@/components/site-footer";
import { LucienPanel } from "@/components/lucien-panel";
import { Dust } from "@/components/dust";

export const Route = createFileRoute("/tour")({ component: TourPage });

function TourPage() {
  return (
    <div className="bg-bg text-fg min-h-svh overflow-x-hidden">
      <Dust />
      <Nav />
      <main className="relative z-10">
        <Walkthrough variant="page" />
        <div className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
          <Link
            to="/"
            hash="generate"
            className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Generate a personalized course
          </Link>
        </div>
      </main>
      <SiteFooter />
      <LucienPanel />
    </div>
  );
}
