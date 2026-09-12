import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { LucienPanel } from "@/components/lucien-panel";
import { Dust } from "@/components/dust";
import { BabVault } from "@/components/bab-vault";

export const Route = createFileRoute("/bab")({ component: BabPage });

function BabPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-bg text-fg">
      <Dust />
      <Nav />
      <main className="relative z-10 pt-16 md:pt-20">
        <BabVault />
      </main>
      <SiteFooter />
      <LucienPanel />
    </div>
  );
}
