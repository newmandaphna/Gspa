import { notFound } from "next/navigation";
import { CartridgeHero } from "@/components/three/CartridgeHero";
import { BrassStill, type Shot } from "@/components/three/BrassStill";

/**
 * Render lab: one full-window 3D composition per URL, for scripts/render-brass.mjs.
 * Only served in development or when RENDER_LAB=1; a production visitor gets a 404.
 */
export const metadata = { robots: { index: false, follow: false } };

const STILLS: Shot[] = ["casings", "round-side", "headstamp", "pair", "casing", "lineup", "trio", "duo", "rest"];

export default async function RenderLab({ params, searchParams }: { params: Promise<{ shot: string }>; searchParams: Promise<{ t?: string; bg?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.RENDER_LAB !== "1") notFound();
  const { shot } = await params;
  const { t, bg } = await searchParams;
  const transparent = bg === "none";
  return (
    <div className="lab-root fixed inset-0 z-[200]" style={{ background: transparent ? "transparent" : "#0a0a0b" }}>
      {/* The lab sits inside the site layout; hide the nav, footer and desk log so only the render shows. */}
      <style>{"html,body{background:transparent!important} body *{visibility:hidden} .lab-root,.lab-root *{visibility:visible}"}</style>
      {shot === "hero" || shot === "hero-portrait" ? (
        <CartridgeHero still={{ t: Number(t ?? 1.2), transparent }} />
      ) : STILLS.includes(shot as Shot) ? (
        <BrassStill shot={shot as Shot} transparent={transparent} />
      ) : (
        notFound()
      )}
    </div>
  );
}
