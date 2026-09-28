import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * The brass studio: a 9mm Luger round modeled to scale from the logo's
 * cartridge, its spent casing, and the lighting they are shot in. Pure three,
 * no React, so the live hero and the still renders use one model.
 *
 * Units: 1 unit is about 10.3 mm. Case 19.15 mm, overall length 29.7 mm.
 */

export const BRASS = "#c99a45";
export const COPPER = "#b5673b";
export const NIGHT = 0x0a0a0b;

const R = 0.48;
const CASE_LEN = 1.855;

function caseProfile(): THREE.Vector2[] {
  return [
    [0, 0], [R, 0], [R, 0.1], [R * 0.99, 0.12], [R * 0.84, 0.15], [R * 0.82, 0.26], [R * 0.96, 0.31],
    [R * 0.985, 0.34], [R * 0.955, CASE_LEN], [R * 0.93, CASE_LEN + 0.015],
  ].map(([x, y]) => new THREE.Vector2(x, y));
}

/** The open mouth of a fired case: the wall turns inward, then down into the dark. */
function spentProfile(): THREE.Vector2[] {
  const p = caseProfile();
  p.push(new THREE.Vector2(R * 0.9, CASE_LEN + 0.015), new THREE.Vector2(R * 0.88, CASE_LEN - 0.05), new THREE.Vector2(R * 0.87, 0.5), new THREE.Vector2(0, 0.45));
  return p;
}

function bulletProfile(): THREE.Vector2[] {
  const b0 = 1.6, shank = 1.98, tip = 2.88, rb = R * 0.915, meplat = 0.07;
  const pts = [new THREE.Vector2(0, b0), new THREE.Vector2(rb, b0), new THREE.Vector2(rb, shank)];
  const n = 48;
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(meplat, rb * Math.cos(a)), shank + (tip - shank) * Math.sin(a) ** 0.92));
  }
  pts.push(new THREE.Vector2(0, tip + 0.004));
  return pts;
}

/** Headstamp as a bump map: primer, rim ring and the club's name stamped around it. */
function headstampTexture(fired: boolean): THREE.CanvasTexture {
  const s = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#888";
  g.fillRect(0, 0, s, s);
  g.translate(s / 2, s / 2);
  g.strokeStyle = "#6a6a6a";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(0, 0, 470, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#555";
  g.beginPath();
  g.arc(0, 0, 150, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#9a9a9a";
  g.beginPath();
  g.arc(0, 0, 132, 0, Math.PI * 2);
  g.fill();
  if (fired) {
    g.fillStyle = "#6f6f6f";
    g.beginPath();
    g.arc(12, -8, 34, 0, Math.PI * 2);
    g.fill();
  }
  g.font = "700 78px Arial, Helvetica, sans-serif";
  g.fillStyle = "#4a4a4a";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const text = "GUN SPA   9MM LUGER   ";
  [...text].forEach((ch, i) => {
    g.save();
    g.rotate((i / text.length) * Math.PI * 2);
    g.fillText(ch, 0, -300);
    g.restore();
  });
  return new THREE.CanvasTexture(c);
}

export type Materials = { brass: THREE.MeshPhysicalMaterial; copper: THREE.MeshPhysicalMaterial; dispose(): void };

export function makeMaterials(): Materials {
  const brass = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(BRASS), metalness: 1, roughness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.14, envMapIntensity: 1.3 });
  const copper = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(COPPER), metalness: 1, roughness: 0.26, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.15 });
  return { brass, copper, dispose: () => { brass.dispose(); copper.dispose(); } };
}

function base(mat: THREE.MeshPhysicalMaterial, fired: boolean): THREE.Mesh {
  const m = mat.clone();
  const stamp = headstampTexture(fired);
  m.bumpMap = stamp;
  m.bumpScale = 7;
  // The stamped letters and the primer read through roughness as well as relief.
  m.roughnessMap = stamp;
  m.roughness = 0.55;
  m.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(R, 128), m);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = -0.002;
  return mesh;
}

/** A loaded round standing on its base, origin at the base center. */
export function buildRound(mats: Materials, segments = 180): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.LatheGeometry(caseProfile(), segments), mats.brass));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(bulletProfile(), segments), mats.copper));
  g.add(base(mats.brass, false));
  return g;
}

/** A fired case, mouth open, origin at the base center. */
export function buildCasing(mats: Materials, segments = 96): THREE.Group {
  const g = new THREE.Group();
  const mat = mats.brass.clone();
  mat.side = THREE.DoubleSide;
  mat.roughness = 0.28;
  g.add(new THREE.Mesh(new THREE.LatheGeometry(spentProfile(), segments), mat));
  g.add(base(mats.brass, true));
  return g;
}

export type Studio = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  dispose(): void;
};

/** Environment, camera and a three-light rig: a warm key from above, a warm rim, a cool kicker. */
export function makeStudio(renderer: THREE.WebGLRenderer, opts: { transparent?: boolean; fov?: number } = {}): Studio {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(NIGHT, opts.transparent ? 0 : 1);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.03);
  scene.environment = envRT.texture;
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 28, 1, 0.1, 100);
  const key = new THREE.SpotLight(0xfff1dc, 60, 30, 0.5, 0.6, 1.6);
  key.position.set(0, 7, 1.4);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xffe2b0, 2.6);
  rim.position.set(6, 2, -5);
  const kick = new THREE.DirectionalLight(0x9bb4d8, 0.8);
  kick.position.set(-6, 1, -3);
  scene.add(rim, kick);
  (scene.userData as { key: THREE.SpotLight }).key = key;
  return {
    scene,
    camera,
    dispose() {
      envRT.dispose();
      pmrem.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          const mat = m.material as THREE.MeshPhysicalMaterial;
          mat.bumpMap?.dispose();
          mat.dispose();
        }
      });
    },
  };
}

/** A dark glossy floor at height `y`: a mirrored copy of `subject` seen through a fading black surface. */
export function addFloor(scene: THREE.Scene, subject: THREE.Object3D, y: number): { update(): void } {
  const copy = subject.clone(true);
  copy.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      const mat = (m.material as THREE.MeshPhysicalMaterial).clone();
      mat.envMapIntensity *= 0.6;
      mat.color.multiplyScalar(0.55);
      m.material = mat;
    }
  });
  copy.matrixAutoUpdate = false;
  scene.add(copy);
  const reflect = new THREE.Matrix4().makeScale(1, -1, 1).setPosition(0, 2 * y, 0);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { c: { value: new THREE.Vector3() } },
      vertexShader: "varying vec3 w;void main(){vec4 p=modelMatrix*vec4(position,1.);w=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}",
      fragmentShader: "uniform vec3 c;varying vec3 w;void main(){float d=length(w.xz-c.xz);float a=mix(.72,1.,smoothstep(.0,1.6,d));gl_FragColor=vec4(.039,.039,.043,a);}",
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.renderOrder = 1;
  scene.add(floor);
  const world = new THREE.Vector3();
  return {
    update() {
      subject.updateMatrixWorld(true);
      copy.matrix.multiplyMatrices(reflect, subject.matrixWorld);
      copy.updateMatrixWorld(true);
      subject.getWorldPosition(world);
      (floor.material as THREE.ShaderMaterial).uniforms.c.value.copy(world);
    },
  };
}

/** A soft cone of warm light falling from above, like a lane downlight. */
export function addLightCone(scene: THREE.Scene, x: number, z = -0.4): THREE.Mesh {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 7.5, 64, 1, true),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: "varying vec2 v;varying vec3 n;void main(){v=uv;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec2 v;varying vec3 n;void main(){float edge=pow(1.-abs(n.z),2.2);float a=(1.-edge)*v.y*v.y*0.06;gl_FragColor=vec4(1.,.86,.62,a);}",
    }),
  );
  cone.position.set(x, 2.3, z);
  scene.add(cone);
  return cone;
}
