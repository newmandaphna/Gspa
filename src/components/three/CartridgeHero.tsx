"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The home hero's object: the logo's cartridge as a lit 9mm round, turning
 * slowly on a glossy black floor under a lane light.
 *
 * - The still render (/renders/hero-round.webp, made by scripts/render-brass.mjs
 *   from this same scene) paints first, so there is never an empty hero.
 * - three.js loads only once the page is idle, only on hardware WebGL, and
 *   only when the visitor has not asked for reduced motion or less data.
 * - The round leans toward the pointer, spins when tapped, and stops drawing
 *   whenever it is off screen or the tab is hidden.
 */
type Props = {
  className?: string;
  /** Where the round stands in the frame, as a fraction of the width (0 left, 1 right). */
  anchor?: number;
  /** Render one frame at time `t` seconds and set window.__brassReady; used by the render script. */
  still?: { t: number; transparent?: boolean };
  poster?: string;
  /** Poster for portrait screens, where the round stands centered in the upper frame. */
  posterPortrait?: string;
};

/** True when WebGL is missing or drawn by the CPU. */
function softwareGl(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch {
    return true;
  }
}

export function CartridgeHero({ className, anchor = 0.8, still, poster = "/renders/hero-round.webp", posterPortrait = "/renders/hero-round-portrait.webp" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!still && (reduced || saveData)) return;

    let disposed = false;
    let raf = 0;
    let cleanup = () => {};

    (async () => {
      if (!still) {
        // Start after the page settles, and only on real graphics hardware: a software
        // renderer (SwiftShader, llvmpipe) blocks the main thread for seconds, so those
        // visitors keep the still render.
        await new Promise<void>((resolve) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(() => resolve(), { timeout: 2500 }) : setTimeout(resolve, 1200)));
        if (disposed || softwareGl()) return;
      }
      const THREE = await import("three");
      const brass = await import("./brass");
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: Boolean(still?.transparent), preserveDrawingBuffer: Boolean(still) });
      } catch {
        return;
      }
      const studio = brass.makeStudio(renderer, { transparent: still?.transparent });
      const mats = brass.makeMaterials();
      const round = brass.buildRound(mats);
      const pivot = new THREE.Group();
      pivot.add(round);
      studio.scene.add(pivot);
      const floorY = -1.25;
      pivot.position.y = floorY;
      const floor = brass.addFloor(studio.scene, pivot, floorY);
      const cone = brass.addLightCone(studio.scene, 0);
      const key = (studio.scene.userData as { key: import("three").SpotLight }).key;
      key.target = pivot;

      const cam = studio.camera;
      let w = 0, h = 0;
      function frame() {
        const r = el!.getBoundingClientRect();
        w = Math.max(1, Math.round(r.width));
        h = Math.max(1, Math.round(r.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, still ? 2 : 1.75));
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
        // Portrait screens: the round sits centered in the upper part, a little smaller.
        const portrait = w / h < 0.9;
        const distance = portrait ? 12.5 : 10.5;
        cam.position.set(0, portrait ? 0.9 : 0.35, distance);
        cam.lookAt(0, portrait ? -0.9 : -0.2, 0);
        cam.updateProjectionMatrix();
        // Place the round at `anchor` across the frame, measured at the round's depth.
        const halfW = Math.tan((cam.fov * Math.PI) / 360) * distance * cam.aspect;
        const x = portrait ? 0 : (anchor - 0.5) * 2 * halfW;
        pivot.position.x = x;
        cone.position.x = x;
        key.position.set(x - 0.15, 7, 1.4);
      }
      frame();

      let tx = 0, ty = 0, px = 0, py = 0;
      let spin = 0;
      const onMove = (e: PointerEvent) => {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
      };
      const onTap = () => {
        spin += Math.PI * 2;
      };
      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(tick);
      });
      io.observe(el);
      const ro = new ResizeObserver(frame);
      ro.observe(el);
      window.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("click", onTap);

      const t0 = performance.now();
      let last = t0;
      let yaw = still ? still.t * 0.35 : 0.6;
      function tick(now: number) {
        raf = 0;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        px += (tx - px) * 0.05;
        py += (ty - py) * 0.05;
        const extra = spin * Math.min(1, dt * 3.2);
        spin -= extra;
        yaw += dt * 0.35 + extra;
        pivot.rotation.set(py * 0.06, yaw, -px * 0.05);
        floor.update();
        renderer.render(studio.scene, cam);
        if (!still && visible && !document.hidden) raf = requestAnimationFrame(tick);
      }

      if (still) {
        pivot.rotation.set(0, yaw, 0);
        floor.update();
        renderer.render(studio.scene, cam);
        (window as unknown as { __brassReady?: boolean }).__brassReady = true;
      } else {
        raf = requestAnimationFrame((n) => {
          last = n;
          tick(n);
          setLive(true);
        });
      }
      const onVis = () => {
        if (!document.hidden && visible && !raf) raf = requestAnimationFrame(tick);
      };
      document.addEventListener("visibilitychange", onVis);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        el.removeEventListener("click", onTap);
        document.removeEventListener("visibilitychange", onVis);
        mats.dispose();
        studio.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [anchor, still]);

  return (
    <div ref={wrap} className={cn("absolute inset-0", className)} aria-hidden="true">
      {!still && (
        <picture>
          <source media="(max-aspect-ratio: 9/10)" srcSet={posterPortrait} />
          <img
            src={poster}
            alt=""
            className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", live ? "opacity-0" : "opacity-100")}
            style={{ objectPosition: `${Math.round(anchor * 100)}% 50%` }}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      )}
      <canvas ref={canvas} className={cn("absolute inset-0 h-full w-full transition-opacity duration-700", live || still ? "opacity-100" : "opacity-0")} />
    </div>
  );
}
