import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
} from "three";
import fallbackUrl from "./assets/graduation-cap.webp";
import { AUTH_MOTION } from "./auth-motion";

function mortarboard() {
  const half = 1.95,
    radius = 0.12;
  const shape = new Shape();
  shape.moveTo(-half + radius, -half);
  shape.lineTo(half - radius, -half);
  shape.quadraticCurveTo(half, -half, half, -half + radius);
  shape.lineTo(half, half - radius);
  shape.quadraticCurveTo(half, half, half - radius, half);
  shape.lineTo(-half + radius, half);
  shape.quadraticCurveTo(-half, half, -half, half - radius);
  shape.lineTo(-half, -half + radius);
  shape.quadraticCurveTo(-half, -half, -half + radius, -half);
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    bevelSegments: 3,
    curveSegments: 8,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export default function GraduationCap({
  running,
  reduced,
}: {
  running: boolean;
  reduced: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controller = useRef<{
    update: (active: boolean, reduced: boolean) => void;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (failed || !hostRef.current) return;
    const host = hostRef.current;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.dataset.graduationCap = "true";
    renderer.domElement.dataset.ready = "true";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.append(renderer.domElement);
    const style = getComputedStyle(host);
    const material = (token: string, roughness: number, metalness: number) =>
      new MeshStandardMaterial({
        color: new Color(style.getPropertyValue(token).trim()),
        roughness,
        metalness,
        transparent: true,
        alphaTest: 0.02,
        side: DoubleSide,
      });
    const cloth = material("--auth-cap-cloth", 0.58, 0.08);
    const gold = material("--auth-cap-gold", 0.3, 0.48);
    const inner = material("--auth-cap-inner", 0.92, 0);
    const reveal = { value: -2.6 },
      assembly = { value: 0 };
    for (const surface of [cloth, gold, inner]) {
      surface.onBeforeCompile = (shader) => {
        shader.uniforms.capReveal = reveal;
        shader.uniforms.capAssembly = assembly;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying float capY;",
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\ncapY = (modelMatrix * vec4(position, 1.0)).y;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying float capY;\nuniform float capReveal;\nuniform float capAssembly;",
          )
          .replace(
            "#include <alphatest_fragment>",
            "diffuseColor.a *= smoothstep(capY - 0.055, capY + 0.055, capReveal);\ndiffuseColor.a *= mix(smoothstep(0.55, 0.65, fract(capY * 26.0)), 1.0, capAssembly);\n#include <alphatest_fragment>",
          );
      };
    }
    const cap = new Group();
    const geometries: BufferGeometry[] = [];
    const add = (
      geometry: BufferGeometry,
      surface: MeshStandardMaterial,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      geometries.push(geometry);
      const mesh = new Mesh(geometry, surface);
      mesh.position.set(x, y, z);
      cap.add(mesh);
      return mesh;
    };
    add(mortarboard(), cloth, 0, 0.06);
    add(new CylinderGeometry(0.95, 1.1, 1.2, 64, 1, true), cloth, 0, -0.6);
    add(new CylinderGeometry(1.08, 1.115, 0.3, 64, 1, true), gold, 0, -1.04);
    add(new CylinderGeometry(0.87, 1.015, 1.17, 64, 1, true), inner, 0, -0.6);
    const rim = add(new TorusGeometry(1.07, 0.045, 12, 64), gold, 0, -1.2);
    rim.rotation.x = Math.PI / 2;
    const lining = add(new CircleGeometry(0.88, 64), inner, 0, -0.12);
    lining.rotation.x = Math.PI / 2;
    add(new SphereGeometry(0.11, 20, 12), gold, 0, 0.16);
    const cord = new CatmullRomCurve3([
      new Vector3(0, 0.17, 0),
      new Vector3(-0.8, 0.15, -0.7),
      new Vector3(-1.68, 0.1, -1.4),
      new Vector3(-1.96, -0.45, -1.5),
      new Vector3(-2.02, -0.92, -1.5),
    ]);
    add(new TubeGeometry(cord, 40, 0.032, 8, false), gold);
    add(new SphereGeometry(0.115, 20, 12), gold, -2.02, -0.95, -1.5);
    add(new CylinderGeometry(0.025, 0.13, 0.84, 20), gold, -2.07, -1.46, -1.5);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const strand = new CatmullRomCurve3([
        new Vector3(-2.02, -1.03, -1.5),
        new Vector3(
          -2.03 + Math.cos(angle) * 0.065,
          -1.28,
          -1.5 + Math.sin(angle) * 0.065,
        ),
        new Vector3(
          -2.1 + Math.cos(angle) * 0.16,
          -1.93 + Math.sin(angle) * 0.035,
          -1.5 + Math.sin(angle) * 0.14,
        ),
      ]);
      add(new TubeGeometry(strand, 12, 0.016, 5, false), gold);
    }
    const scene = new Scene();
    scene.add(cap);
    scene.add(new AmbientLight(0xffffff, 1.7));
    const key = new DirectionalLight(0xffebce, 3.2);
    key.position.set(-3, 4, 6);
    const fill = new DirectionalLight(0xdce8ff, 2);
    fill.position.set(3, 1, -4);
    scene.add(key, fill);
    const camera = new PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 0.15, 9);
    camera.lookAt(0, -0.3, 0);
    let disposed = false,
      elapsed = 0,
      previous = 0,
      frame = 0,
      active = false,
      reduce = false;
    const draw = () => {
      if (disposed) return;
      const phase = elapsed % AUTH_MOTION.hologramLoopSeconds;
      cap.rotation.set(
        -0.6,
        reduce
          ? 0.5
          : 0.5 + (elapsed / AUTH_MOTION.hologramLoopSeconds) * Math.PI * 2,
        -0.22,
      );
      const growth = Math.min(1, phase / AUTH_MOTION.hologramRevealSeconds);
      const fade = Math.min(
        1,
        (AUTH_MOTION.hologramLoopSeconds - phase) /
          (AUTH_MOTION.hologramLoopSeconds -
            AUTH_MOTION.hologramFadeStartSeconds),
      );
      const amount = reduce ? 1 : Math.max(0, Math.min(growth, fade));
      reveal.value = -2.6 + amount * 5.2;
      assembly.value = amount;
      renderer.render(scene, camera);
      renderer.domElement.dataset.yaw = cap.rotation.y.toFixed(4);
    };
    const tick = (now: number) => {
      if (disposed || !active || reduce) return;
      if (previous) elapsed += (now - previous) / 1000;
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    controller.current = {
      update(nextActive, nextReduced) {
        active = nextActive;
        reduce = nextReduced;
        cancelAnimationFrame(frame);
        previous = 0;
        draw();
        if (active && !reduce) frame = requestAnimationFrame(tick);
      },
    };
    const resize = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = Math.max(
        7.4,
        (5.8 / (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)) *
          1.12,
      );
      camera.lookAt(0, -0.3, 0);
      camera.updateProjectionMatrix();
      draw();
    });
    resize.observe(host);
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true;
      controller.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      for (const geometry of geometries) geometry.dispose();
      for (const surface of [cloth, gold, inner]) surface.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [failed]);
  useEffect(() => {
    controller.current?.update(running, reduced);
  }, [running, reduced, failed]);
  return (
    <div
      className="auth-hologram"
      ref={hostRef}
      data-fallback={failed || undefined}
    >
      {failed && (
        <img className="auth-hologram-fallback" src={fallbackUrl} alt="" />
      )}
    </div>
  );
}
