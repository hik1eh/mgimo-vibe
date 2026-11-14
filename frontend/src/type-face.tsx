import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { AUTH_MOTION } from "./auth-motion";

// An original parametric bust, not a copy of the reference author's 3D model.
// x/y/z and UV live in model space; the texture consists entirely of live type.
function headGeometry() {
  const contour = [
    [-1.48, 0.82, 0.48],
    [-1.3, 0.36, 0.3],
    [-1.1, 0.29, 0.28],
    [-0.85, 0.29, 0.3],
    [-0.7, 0.43, 0.4],
    [-0.47, 0.57, 0.49],
    [-0.16, 0.67, 0.58],
    [0.18, 0.7, 0.62],
    [0.52, 0.69, 0.63],
    [0.83, 0.59, 0.57],
    [1.06, 0.43, 0.44],
    [1.23, 0.2, 0.22],
    [1.28, 0.015, 0.015],
  ];
  const points: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const rings = 112,
    sides = 144;
  const bump = (value: number, center: number, width: number) =>
    Math.exp(-Math.pow((value - center) / width, 2));
  for (let row = 0; row <= rings; row++) {
    const y = -1.48 + (row / rings) * 2.76;
    let segment = 0;
    while (segment < contour.length - 2 && y > contour[segment + 1][0])
      segment++;
    const a = contour[segment],
      b = contour[segment + 1];
    const t = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
    const smooth = t * t * (3 - 2 * t);
    const width = a[1] + (b[1] - a[1]) * smooth;
    const depth = a[2] + (b[2] - a[2]) * smooth;
    for (let column = 0; column <= sides; column++) {
      const theta = (column / sides) * Math.PI * 2;
      const x = width * Math.sin(theta);
      let z = depth * Math.cos(theta);
      if (Math.cos(theta) > 0 && y > -0.76) {
        const front = Math.pow(Math.cos(theta), 4);
        const nose =
          0.34 * bump(x, 0, 0.12) * bump(y, 0.02, 0.16) +
          0.14 * bump(x, 0, 0.085) * bump(y, 0.25, 0.26);
        const eyes =
          -0.22 *
          (bump(x, -0.26, 0.13) + bump(x, 0.26, 0.13)) *
          bump(y, 0.28, 0.095);
        const brows =
          0.055 *
          (bump(x, -0.28, 0.17) + bump(x, 0.28, 0.17)) *
          bump(y, 0.4, 0.065);
        const lips =
          0.075 * bump(x, 0, 0.28) * bump(y, -0.3, 0.035) +
          0.055 * bump(x, 0, 0.25) * bump(y, -0.38, 0.045);
        const chin = 0.09 * bump(x, 0, 0.28) * bump(y, -0.54, 0.13);
        z += front * (nose + eyes + brows + lips + chin);
      }
      points.push(x, y, z);
      uv.push(column / sides, row / rings);
      if (row < rings && column < sides) {
        const index = row * (sides + 1) + column;
        indices.push(
          index,
          index + sides + 1,
          index + 1,
          index + 1,
          index + sides + 1,
          index + sides + 2,
        );
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export default function TypeFace({
  running,
  reduced,
}: {
  running: boolean;
  reduced: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const controller = useRef<{
    update: (running: boolean, reduced: boolean) => void;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (failed || !container.current) return;
    const host = container.current;
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.dataset.typeface = "true";
    host.append(renderer.domElement);
    const scene = new Scene();
    const camera = new PerspectiveCamera(33, 1, 0.1, 20);
    camera.position.set(0, -0.02, 5.6);
    camera.lookAt(0, -0.1, 0);
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 2048;
    textureCanvas.height = 2048;
    const context = textureCanvas.getContext("2d")!;
    context.fillStyle = "black";
    context.fillRect(0, 0, 2048, 2048);
    context.fillStyle = "white";
    const style = getComputedStyle(host);
    context.font = `${style.fontSize} ${style.fontFamily}`;
    const words = "University North Campus · ";
    const wordWidth = context.measureText(words).width;
    for (let row = 0; row < 73; row++) {
      for (let x = (-(row % 2) * wordWidth) / 2; x < 2048; x += wordWidth) {
        context.fillText(words, x, row * 28 + 20);
      }
    }
    const texture = new CanvasTexture(textureCanvas);
    const color = new Color(style.color);
    const letters = new MeshLambertMaterial({
      color,
      alphaMap: texture,
      alphaTest: 0.18,
      side: DoubleSide,
      transparent: true,
    });
    scene.add(new AmbientLight(0xffffff, 1.1));
    const light = new DirectionalLight(0xffffff, 1.6);
    light.position.set(-3, 4, 5);
    scene.add(light);
    const revealHeight = { value: 1.3 };
    letters.onBeforeCompile = (shader) => {
      shader.uniforms.authRevealHeight = revealHeight;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying float authHeight;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nauthHeight = (modelMatrix * vec4(position, 1.0)).y;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying float authHeight;\nuniform float authRevealHeight;",
        )
        .replace(
          "#include <alphatest_fragment>",
          "diffuseColor.a *= smoothstep(authHeight - 0.12, authHeight + 0.12, authRevealHeight);\n#include <alphatest_fragment>",
        );
    };
    const depthOnly = new MeshBasicMaterial({
      colorWrite: false,
      side: DoubleSide,
    });
    const geometry = headGeometry();
    const earGeometry = new SphereGeometry(1, 20, 28);
    const bust = new Group();
    const addSurface = (
      surface: BufferGeometry,
      x: number,
      y: number,
      scale: [number, number, number],
    ) => {
      const occluder = new Mesh(surface, depthOnly);
      occluder.position.set(x, y, 0);
      occluder.scale.set(...scale);
      occluder.scale.multiplyScalar(0.996);
      occluder.renderOrder = 0;
      const type = new Mesh(surface, letters);
      type.position.set(x, y, 0);
      type.scale.set(...scale);
      type.renderOrder = 1;
      bust.add(occluder, type);
    };
    addSurface(geometry, 0, 0, [1, 1, 1]);
    addSurface(earGeometry, -0.69, 0.02, [0.1, 0.22, 0.12]);
    addSurface(earGeometry, 0.69, 0.02, [0.1, 0.22, 0.12]);
    scene.add(bust);
    let elapsed = 0,
      previous = 0,
      frame = 0;
    let active = false,
      reduce = false,
      disposed = false;
    const render = () => {
      const phase = elapsed % AUTH_MOTION.headLoopSeconds;
      bust.rotation.y = reduce
        ? -0.9
        : -0.8 + (elapsed / AUTH_MOTION.headLoopSeconds) * Math.PI * 2;
      bust.rotation.z = -0.035;
      const reveal = Math.min(1, phase / AUTH_MOTION.headRevealSeconds);
      const fade = Math.min(
        1,
        (AUTH_MOTION.headLoopSeconds - phase) /
          (AUTH_MOTION.headLoopSeconds - AUTH_MOTION.headFadeStartSeconds),
      );
      revealHeight.value = reduce ? 1.42 : -1.48 + Math.min(reveal, fade) * 2.9;
      renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      if (disposed || !active || reduce) return;
      if (previous) elapsed += Math.min((now - previous) / 1000, 0.1);
      previous = now;
      render();
      frame = requestAnimationFrame(tick);
    };
    controller.current = {
      update(nextActive, nextReduced) {
        active = nextActive;
        reduce = nextReduced;
        cancelAnimationFrame(frame);
        previous = 0;
        render();
        if (active && !reduce) frame = requestAnimationFrame(tick);
      },
    };
    const resize = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
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
      geometry.dispose();
      earGeometry.dispose();
      letters.dispose();
      depthOnly.dispose();
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
      className="auth-typeface"
      ref={container}
      data-fallback={failed || undefined}
    >
      {failed && (
        <p className="auth-type-fallback">
          University
          <br />
          North
          <br />
          <em>Campus.</em>
        </p>
      )}
    </div>
  );
}
