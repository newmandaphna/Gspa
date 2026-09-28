"use client";

import { useEffect, useRef } from "react";

/**
 * Still compositions rendered from the brass studio, used by
 * scripts/render-brass.mjs to make the site's product shots. Each shot is one
 * frame on a transparent or night background; the script saves it as WebP.
 */
export type Shot = "casings" | "round-side" | "headstamp" | "pair" | "casing" | "lineup" | "trio" | "duo" | "rest";

export function BrassStill({ shot, transparent = false }: { shot: Shot; transparent?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    let dispose = () => {};
    (async () => {
      const THREE = await import("three");
      const brass = await import("./brass");
      const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: transparent, preserveDrawingBuffer: true });
      const w = cv.clientWidth, h = cv.clientHeight;
      renderer.setPixelRatio(2);
      renderer.setSize(w, h, false);
      const studio = brass.makeStudio(renderer, { transparent, fov: shot === "headstamp" ? 22 : 26 });
      const { scene, camera } = studio;
      camera.aspect = w / h;
      const mats = brass.makeMaterials();
      const key = (scene.userData as { key: import("three").SpotLight }).key;

      // A black floor that ignores the studio environment, with a soft warm pool under the key light.
      const darkGround = (cx = 0, cz = 0, radius = 7) => {
        const c = document.createElement("canvas");
        c.width = c.height = 512;
        const g2 = c.getContext("2d")!;
        const grad = g2.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, "#211c16");
        grad.addColorStop(0.45, "#0f0d0b");
        grad.addColorStop(1, "#0a0a0b");
        g2.fillStyle = grad;
        g2.fillRect(0, 0, 512, 512);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const pool = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(cx, 0, cz);
        const far = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0x0a0a0b, toneMapped: false }));
        far.rotation.x = -Math.PI / 2;
        far.position.y = -0.001;
        scene.add(pool, far);
      };
      // Soft contact shadow: a dark blurred ellipse under an object lying on the floor.
      const shadowTex = (() => {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const g2 = c.getContext("2d")!;
        const grad = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, "rgba(0,0,0,0.85)");
        grad.addColorStop(0.55, "rgba(0,0,0,0.35)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g2.fillStyle = grad;
        g2.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
      })();
      const contact = (x: number, z: number, sx: number, sz: number, rot = 0) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
        m.rotation.set(-Math.PI / 2, 0, rot);
        m.scale.set(sx, sz, 1);
        m.position.set(x, 0.003, z);
        scene.add(m);
      };
      // Seeded randomness so a re-render is identical.
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

      if (shot === "casings") {
        // Spent brass scattered on a black floor, low three-quarter view. Placement rejects overlaps.
        const placed: { x: number; z: number }[] = [];
        let tries = 0;
        while (placed.length < 17 && tries++ < 2000) {
          const x = (rnd() - 0.5) * 9.5, z = (rnd() - 0.5) * 5.5;
          if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < 1.55)) continue;
          placed.push({ x, z });
          const c = brass.buildCasing(mats, 64);
          if (rnd() < 0.2) {
            c.position.set(x, 0, z);
            c.rotation.y = rnd() * Math.PI;
            contact(x, z, 1.35, 1.35);
          } else {
            const yaw = rnd() * Math.PI * 2;
            c.rotation.set(0, 0, Math.PI / 2);
            c.position.set(x, 0.455, z);
            c.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), yaw);
            // The case's axis now runs along (cos yaw, 0, -sin yaw) from its base toward the mouth.
            contact(x - Math.cos(yaw) * 0.93, z + Math.sin(yaw) * 0.93, 2.3, 0.95, yaw);
          }
          scene.add(c);
        }
        darkGround();
        key.position.set(0.5, 10, 3);
        key.intensity = 38;
        key.angle = 0.75;
        key.penumbra = 0.9;
        key.target.position.set(0, 0, 0);
        camera.position.set(0, 7.4, 12.5);
        camera.lookAt(0, 0, 0.2);
      } else if (shot === "round-side") {
        // One round lying on its side, a casing behind it, low and close.
        const round = brass.buildRound(mats);
        round.rotation.set(0, 0, Math.PI / 2);
        round.position.set(1.45, 0.465, 0);
        round.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -0.35);
        contact(0.1, 0.45, 3.4, 1.05, -0.35);
        const casing = brass.buildCasing(mats);
        casing.rotation.set(0, 0.4, 0);
        casing.position.set(-1.6, 0, -1.2);
        contact(-1.6, -1.2, 1.4, 1.4);
        scene.add(round, casing);
        darkGround();
        key.position.set(0, 7, 2.5);
        key.intensity = 40;
        key.target.position.set(0, 0, 0);
        camera.position.set(0.2, 1.7, 7.4);
        camera.lookAt(0, 0.35, 0);
      } else if (shot === "headstamp") {
        // The base of a fired case, face on, a raking light across the stamp.
        const c = brass.buildCasing(mats);
        c.rotation.set(-Math.PI / 2 + 0.16, 0, 0.35);
        scene.add(c);
        key.position.set(-4, 3, 4);
        key.angle = 0.35;
        key.intensity = 90;
        key.target.position.set(0, 0, 0);
        camera.position.set(0.05, 0.1, 3.6);
        camera.lookAt(0, 0, 0);
      } else if (shot === "casing") {
        // One fired case, side on and a little turned, for the ejection sprite. Transparent background.
        const c = brass.buildCasing(mats);
        c.rotation.set(0.25, 0.5, Math.PI / 2 - 0.2);
        c.position.set(0.9, 0, 0);
        scene.add(c);
        key.position.set(-2, 6, 4);
        key.target.position.set(0, 0, 0);
        camera.position.set(0, 0.4, 8.5);
        camera.lookAt(0, 0.1, 0);
      } else if (shot === "lineup") {
        // A row of loaded rounds receding along a glossy floor, like lanes seen from the line.
        const row = new THREE.Group();
        for (let i = 0; i < 12; i++) {
          const r = brass.buildRound(mats, 96);
          r.position.set(-5.2 + i * 1.25, 0, -i * 0.9);
          r.rotation.y = i * 0.37;
          row.add(r);
        }
        row.position.y = -1.2;
        scene.add(row);
        brass.addFloor(scene, row, -1.2).update();
        key.position.set(-1, 8, 2);
        key.angle = 0.9;
        key.penumbra = 1;
        key.intensity = 70;
        key.target.position.set(0, -1.2, -4);
        camera.position.set(-6.2, 0.5, 6.5);
        camera.lookAt(0.5, -0.6, -3.2);
      } else if (shot === "trio") {
        // Three rounds staggered in depth, portrait frame.
        const g = new THREE.Group();
        const spots: [number, number, number][] = [[-0.95, 0, 0.9], [0.55, 0, -0.2], [1.6, 0, -1.6]];
        spots.forEach(([x, y, z], i) => {
          const r = brass.buildRound(mats);
          r.position.set(x, y, z);
          r.rotation.y = 0.5 + i * 0.8;
          g.add(r);
        });
        g.position.y = -1.3;
        scene.add(g);
        brass.addFloor(scene, g, -1.3).update();
        brass.addLightCone(scene, 0.3, -0.6);
        key.position.set(0.2, 7, 1.2);
        key.target.position.set(0.3, -1.3, -0.3);
        camera.position.set(0, 0.35, 11.5);
        camera.lookAt(0.25, -0.1, 0);
      } else if (shot === "duo") {
        // Two rounds standing close, lit warm from one side: an evening for two.
        const a = brass.buildRound(mats);
        a.position.set(-0.52, -1.2, 0);
        a.rotation.y = 0.9;
        const b = brass.buildRound(mats);
        b.position.set(0.5, -1.2, -0.25);
        b.rotation.y = -0.3;
        const both = new THREE.Group();
        both.add(a, b);
        scene.add(both);
        brass.addFloor(scene, both, -1.2).update();
        key.position.set(-2.5, 6, 2.5);
        key.intensity = 70;
        key.target.position.set(0, -1.2, 0);
        camera.position.set(0.4, 0.3, 8.2);
        camera.lookAt(0, -0.15, 0);
      } else if (shot === "rest") {
        // One spent case lying on warm paper, soft top light, for the light sections.
        renderer.setClearColor(0xf1ede6, 1);
        const paper = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0xebe6dd, toneMapped: false }));
        paper.rotation.x = -Math.PI / 2;
        scene.add(paper);
        const c = brass.buildCasing(mats);
        c.rotation.set(0, 0, Math.PI / 2);
        c.position.set(0.9, 0.455, 0);
        c.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.5);
        const shadow = (x: number, z: number, sx: number, sz: number, rot: number, o: number) => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: o, depthWrite: false, toneMapped: false }));
          m.rotation.set(-Math.PI / 2, 0, rot);
          m.scale.set(sx, sz, 1);
          m.position.set(x, 0.003, z);
          scene.add(m);
        };
        shadow(0.1, 0.55, 2.6, 1.1, 0.5, 0.45);
        shadow(0.05, 0.47, 2.1, 0.7, 0.5, 0.35);
        const r = brass.buildRound(mats);
        r.position.set(-1.7, 0, -1.3);
        r.rotation.y = 0.4;
        shadow(-1.55, -1.1, 1.5, 1.5, 0, 0.4);
        scene.add(c, r);
        key.position.set(1, 9, 3);
        key.intensity = 45;
        key.angle = 0.8;
        key.penumbra = 1;
        key.target.position.set(0, 0, 0);
        camera.position.set(0.3, 4.6, 9.4);
        camera.lookAt(-0.35, 0.9, -0.4);
      } else {
        // A loaded round and a spent case standing side by side.
        const round = brass.buildRound(mats);
        round.position.set(-0.75, -1.2, 0);
        round.rotation.y = 0.6;
        const casing = brass.buildCasing(mats);
        casing.position.set(0.8, -1.2, 0.3);
        casing.rotation.y = -0.4;
        const both = new THREE.Group();
        both.add(round, casing);
        scene.add(both);
        brass.addFloor(scene, both, -1.2).update();
        key.position.set(0, 7, 1.4);
        key.target.position.set(0, -1.2, 0);
        camera.position.set(0, 0.2, 9.5);
        camera.lookAt(0, -0.2, 0);
      }
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      (window as unknown as { __brassReady?: boolean }).__brassReady = true;
      dispose = () => {
        mats.dispose();
        studio.dispose();
        renderer.dispose();
      };
    })();
    return () => dispose();
  }, [shot, transparent]);
  return <canvas ref={canvas} className="block h-full w-full" />;
}
