import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from "three";
import coverUrl from "./assets/student-card-cover.webp";
import { AUTH_MOTION } from "./auth-motion";

function roundedCover(width: number, height: number, depth: number) {
  const x = -width / 2,
    y = -height / 2,
    r = 0.055;
  const shape = new Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.012,
    bevelSegments: 3,
    curveSegments: 8,
    steps: 1,
  });
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(
      i,
      positions.getX(i) / width + 0.5,
      positions.getY(i) / height + 0.5,
    );
  }
  return geometry;
}

export default function StudentCard({
  running,
  reduced,
}: {
  running: boolean;
  reduced: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controller = useRef<{
    update: (active: boolean, reduced: boolean) => void;
    draw: () => void;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (failed || !hostRef.current) return;
    const host = hostRef.current;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.domElement.dataset.studentCard = "true";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.append(renderer.domElement);
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0, 7.9);
    const style = getComputedStyle(host);
    const navy = new Color(style.getPropertyValue("--auth-book-navy").trim());
    const paper = new Color(style.getPropertyValue("--auth-book-paper").trim());
    let disposed = false;
    const texture = new TextureLoader().load(
      coverUrl,
      () => {
        if (!disposed) {
          renderer.domElement.dataset.ready = "true";
          controller.current?.draw();
        }
      },
      undefined,
      () => {
        if (!disposed) setFailed(true);
      },
    );
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const frontMaterial = new MeshStandardMaterial({
      map: texture,
      roughness: 0.72,
      metalness: 0.08,
      transparent: true,
      alphaTest: 0.02,
    });
    const clothMaterial = new MeshStandardMaterial({
      color: navy,
      roughness: 0.76,
      metalness: 0.04,
      transparent: true,
      alphaTest: 0.02,
    });
    const paperMaterial = new MeshStandardMaterial({
      color: paper,
      roughness: 0.95,
      transparent: true,
      alphaTest: 0.02,
    });
    const reveal = { value: 1.4 },
      assembly = { value: 1 };
    for (const material of [frontMaterial, clothMaterial, paperMaterial]) {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.cardReveal = reveal;
        shader.uniforms.cardAssembly = assembly;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying float cardY;",
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\ncardY = (modelMatrix * vec4(position, 1.0)).y;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying float cardY;\nuniform float cardReveal;\nuniform float cardAssembly;",
          )
          .replace(
            "#include <alphatest_fragment>",
            "diffuseColor.a *= smoothstep(cardY - 0.055, cardY + 0.055, cardReveal);\ndiffuseColor.a *= mix(smoothstep(0.55, 0.65, fract(cardY * 28.0)), 1.0, cardAssembly);\n#include <alphatest_fragment>",
          );
      };
    }
    const coverGeometry = roundedCover(3.35, 2.29, 0.035);
    const pagesGeometry = roundedCover(3.23, 2.17, 0.15);
    const spineGeometry = new BoxGeometry(0.065, 2.29, 0.23);
    const card = new Group();
    const front = new Mesh(coverGeometry, [frontMaterial, clothMaterial]);
    front.position.z = 0.082;
    const back = new Mesh(coverGeometry, clothMaterial);
    back.position.z = -0.118;
    const pages = new Mesh(pagesGeometry, paperMaterial);
    pages.position.set(0.018, 0, -0.075);
    const spine = new Mesh(spineGeometry, clothMaterial);
    spine.position.x = -1.66;
    card.add(pages, back, front, spine);
    scene.add(card);
    scene.add(new AmbientLight(0xffffff, 1.6));
    const key = new DirectionalLight(0xffffff, 2.8);
    key.position.set(-3, 3, 6);
    const fill = new DirectionalLight(0xffffff, 1.4);
    fill.position.set(3, 0, -4);
    scene.add(key, fill);
    let elapsed = 0,
      previous = 0,
      frame = 0,
      active = false,
      reduce = false;
    const draw = () => {
      if (disposed) return;
      const phase = elapsed % AUTH_MOTION.cardLoopSeconds;
      card.rotation.y = reduce
        ? -0.26
        : -1.2 + (elapsed / AUTH_MOTION.cardLoopSeconds) * Math.PI * 2;
      card.rotation.x = -0.08;
      card.rotation.z = -0.045;
      const growth = Math.min(1, phase / AUTH_MOTION.cardRevealSeconds);
      const fade = Math.min(
        1,
        (AUTH_MOTION.cardLoopSeconds - phase) /
          (AUTH_MOTION.cardLoopSeconds - AUTH_MOTION.cardFadeStartSeconds),
      );
      const amount = reduce ? 1 : Math.max(0, Math.min(growth, fade));
      reveal.value = -1.35 + amount * 2.7;
      assembly.value = amount;
      renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      if (disposed || !active || reduce) return;
      if (previous) elapsed += (now - previous) / 1000;
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    controller.current = {
      draw,
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
        6.5,
        (3.6 / (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)) *
          1.12,
      );
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
      coverGeometry.dispose();
      pagesGeometry.dispose();
      spineGeometry.dispose();
      frontMaterial.dispose();
      clothMaterial.dispose();
      paperMaterial.dispose();
      texture.dispose();
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
      className="auth-student-card"
      ref={hostRef}
      data-fallback={failed || undefined}
    >
      {failed && (
        <img
          className="auth-card-fallback"
          src={coverUrl}
          alt="Синяя обложка с золотой надписью Студенческий билет"
        />
      )}
    </div>
  );
}
