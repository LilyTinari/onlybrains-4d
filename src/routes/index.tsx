import { createFileRoute } from "@tanstack/react-router";
import { Agents } from "@/components/agents";
import { Announce } from "@/components/announce";
import { Closing } from "@/components/closing";
import { CourseLab } from "@/components/course-lab";
import { Dust } from "@/components/dust";
import { Evidence } from "@/components/evidence";
import { FieldStage } from "@/components/field-stage";
import { Hero } from "@/components/hero";
import { HoloTimeline } from "@/components/holo-timeline";
import { LucienPanel } from "@/components/lucien-panel";
import { LucienSection } from "@/components/lucien-section";
import { Nav } from "@/components/nav";
import { Pathways } from "@/components/pathways";
import { Platform } from "@/components/platform";
import { SiteFooter } from "@/components/site-footer";
import { Timeline } from "@/components/timeline";
import { Walkthrough } from "@/components/walkthrough";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="text-fg min-h-svh overflow-x-hidden">
      <FieldStage />
      <Dust />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Announce />
        <div className="relative bg-bg">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 -translate-y-full veil-into" />
          <CourseLab />
          <Evidence />
          <Walkthrough />
          <LucienSection />
          <Agents />
          <HoloTimeline />
          <Pathways />
          <Timeline />
          <Platform />
          <Closing />
        </div>
      </main>
      <SiteFooter />
      <LucienPanel />
    </div>
  );
}
