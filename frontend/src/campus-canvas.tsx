import { useEffect, useRef } from "react";
import {
  ACESFilmicToneMapping,
  Box3,
  CanvasTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { campusGeometry, releaseGeometry } from "./campus-geometry";
import type { CampusModel } from "./campus-object";

const restingAngle = 0.36;
const tilt = 0.34;
const turn = Math.PI / 30; // Six degrees between the first and resting frames.
const duration = 360;
const fieldOfView = 36;

function positionCamera(
  camera: PerspectiveCamera,
  center: Vector3,
  distance: number,
  yaw: number,
) {
  camera.position.set(
    center.x + distance * Math.sin(yaw) * Math.cos(tilt),
    center.y + distance * Math.sin(tilt),
    center.z + distance * Math.cos(yaw) * Math.cos(tilt),
  );
  camera.lookAt(center);
  camera.updateMatrixWorld();
}

function cameraDistance(
  camera: PerspectiveCamera,
  bounds: Box3,
  center: Vector3,
) {
  const size = bounds.getSize(new Vector3());
  let distance = Math.max(size.x, size.y, size.z) * 2;
  const projected = new Vector3();
  for (let pass = 0; pass < 6; pass++) {
    positionCamera(camera, center, distance, restingAngle);
    let extent = 0;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          projected.set(x, y, z).project(camera);
          extent = Math.max(
            extent,
            Math.abs(projected.x),
            Math.abs(projected.y),
          );
        }
    distance *= Math.max(0.62, extent / 0.85);
  }
  return distance;
}

function contactTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, "rgba(3, 12, 25, 0.56)");
  gradient.addColorStop(0.56, "rgba(3, 12, 25, 0.32)");
  gradient.addColorStop(1, "rgba(3, 12, 25, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

export default function CampusCanvas({
  kind,
  animated,
  onFrame,
}: {
  kind: CampusModel;
  animated: boolean;
  onFrame: (kind: CampusModel | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controls = useRef<{
    show: (kind: CampusModel, animate: boolean) => void;
  } | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setClearColor(0x102a40, 0);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    const canvas = renderer.domElement;
    canvas.dataset.campusCanvas = "";
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera(fieldOfView, 1, 0.1, 160);
    const sky = new HemisphereLight(0xe7f2ff, 0x718aa8, 2.15);
    const key = new DirectionalLight(0xfff3de, 2.55);
    const fill = new DirectionalLight(0xa0c8fb, 1.12);
    key.position.set(-7, 14, 9);
    fill.position.set(8, 5, -4);
    scene.add(sky, key, fill);

    const floorTexture = contactTexture();
    const floorShape = new PlaneGeometry(1, 1);
    const floorMaterial = new MeshBasicMaterial({
      map: floorTexture,
      transparent: true,
      depthWrite: false,
    });
    const floor = new Mesh(floorShape, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const quiet = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const center = new Vector3();
    const bounds = new Box3();
    let model: Group | null = null;
    let current: CampusModel | null = null;
    let rendered: CampusModel | null = null;
    let distance = 24;
    let start = 0;
    let pointer = 0;
    let offset = 0;
    let pending = 0;
    let visible = false;
    let lost = false;

    function requestDraw() {
      if (pending || !visible || lost || document.hidden || !model) return;
      pending = requestAnimationFrame(draw);
    }
    function draw(time: number) {
      pending = 0;
      if (!visible || document.hidden || lost || !current) return;
      const progress =
        quiet.matches || !start
          ? 1
          : Math.max(0, Math.min(1, (time - start) / duration));
      offset = quiet.matches ? 0 : offset + (pointer - offset) * 0.25;
      if (Math.abs(pointer - offset) < 0.0004)
        offset = quiet.matches ? 0 : pointer;
      const yaw = restingAngle + turn * (1 - progress) ** 3 + offset;
      positionCamera(camera, center, distance, yaw);
      renderer.render(scene, camera);
      canvas.dataset.yaw = yaw.toFixed(4);
      canvas.dataset.meshes = String(model!.children.length);
      if (rendered !== current) {
        rendered = current;
        onFrame(current);
        if (start && !quiet.matches) {
          canvas.getAnimations().forEach((animation) => animation.cancel());
          canvas.animate(
            [
              { opacity: 0.35, transform: "translateY(8px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration, easing: "cubic-bezier(.22,.8,.24,1)" },
          );
        }
      }
      if (progress < 1 || (!quiet.matches && offset !== pointer)) requestDraw();
    }
    function resize() {
      const { clientWidth: width, clientHeight: height } = host!;
      if (!width || !height || lost) return;
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, width < 400 ? 1.25 : 1.75),
      );
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (model) distance = cameraDistance(camera, bounds, center);
      requestDraw();
    }
    controls.current = {
      show(next, animate) {
        if (current === next) return;
        if (model) {
          scene.remove(model);
          releaseGeometry(model);
        }
        model = campusGeometry(next);
        scene.add(model);
        current = next;
        bounds.setFromObject(model);
        bounds.getCenter(center);
        const size = bounds.getSize(new Vector3());
        floor.position.set(center.x, bounds.min.y - 0.04, center.z);
        floor.scale.set(
          Math.max(1.75, size.x * 1.25),
          Math.max(1.4, size.z * 1.67),
          1,
        );
        pointer = offset = 0;
        start = animate && !quiet.matches ? performance.now() : 0;
        resize();
      },
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      requestDraw();
    });
    intersection.observe(host);
    const pointerTarget = host.parentElement!;
    function move(event: PointerEvent) {
      if (!fine.matches || quiet.matches || event.pointerType !== "mouse")
        return;
      const box = pointerTarget.getBoundingClientRect();
      pointer = ((event.clientX - box.left) / box.width - 0.5) * 2 * turn;
      requestDraw();
    }
    function reset() {
      pointer = 0;
      requestDraw();
    }
    function fail() {
      lost = true;
      onFrame(null);
    }
    pointerTarget.addEventListener("pointermove", move);
    pointerTarget.addEventListener("pointerleave", reset);
    quiet.addEventListener("change", reset);
    document.addEventListener("visibilitychange", requestDraw);
    canvas.addEventListener("webglcontextlost", fail);
    return () => {
      controls.current = null;
      cancelAnimationFrame(pending);
      intersection.disconnect();
      resizeObserver.disconnect();
      pointerTarget.removeEventListener("pointermove", move);
      pointerTarget.removeEventListener("pointerleave", reset);
      quiet.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", requestDraw);
      canvas.removeEventListener("webglcontextlost", fail);
      if (model) releaseGeometry(model);
      floorTexture.dispose();
      floorShape.dispose();
      floorMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [onFrame]);

  useEffect(() => {
    controls.current?.show(kind, animated);
  }, [kind, animated]);
  return <div ref={hostRef} className="campus-canvas-host" />;
}
