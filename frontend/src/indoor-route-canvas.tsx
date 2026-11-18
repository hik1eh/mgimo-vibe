import { useEffect, useRef } from "react";
import {
  Box3,
  DirectionalLight,
  HemisphereLight,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { createIndoorFloor, type FloorLabel } from "./indoor-route-model";
import type { FloorLayout, FloorSegment } from "./indoor-route-types";

export type IndoorStatus = "loading" | "ready" | "unavailable";

export default function IndoorRouteCanvas({
  floor, segment, room, angle, onStatus,
}: {
  floor: FloorLayout;
  segment?: FloorSegment;
  room: string;
  angle: number;
  onStatus: (status: IndoorStatus) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const labelLayer = useRef<HTMLDivElement>(null);
  const controls = useRef<{
    show: (floor: FloorLayout, segment: FloorSegment | undefined, room: string) => void;
    turn: (angle: number) => void;
  } | null>(null);

  useEffect(() => {
    const mount = host.current!;
    const layer = labelLayer.current!;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      onStatus("unavailable");
      return;
    }
    const canvas = renderer.domElement;
    canvas.className = "indoor-canvas";
    mount.append(canvas);
    const scene = new Scene();
    const skylight = new HemisphereLight(0xe2f0ff, 0x8a9fb4, 1.9);
    const light = new DirectionalLight(0xffedd6, 2.1);
    light.position.set(-330, 600, 410);
    scene.add(skylight, light);
    const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 2200);
    const target = new Vector3();
    const sample = new Vector3();
    const pitch = 0.77;
    const bounds = new Box3();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let model: ReturnType<typeof createIndoorFloor> | undefined;
    let captions: { anchor: FloorLabel; element: HTMLElement }[] = [];
    let raf = 0;
    let drawn = false;
    let lost = false;
    let currentAngle = 0;
    let fromAngle = 0;
    let destination = 0;
    let started = 0;
    let floorNumber = 0;
    let pointCount = 0;

    function schedule() {
      if (!raf && !lost && !document.hidden && model) raf = requestAnimationFrame(draw);
    }
    function draw(time: number) {
      raf = 0;
      const { clientWidth: width, clientHeight: height } = mount;
      if (!model || lost || document.hidden || !width || !height) return;
      const progress = !started || reduced.matches ? 1 : Math.min(1, Math.max(0, (time - started) / 240));
      currentAngle = destination + (fromAngle - destination) * (1 - progress) ** 3;
      camera.position.set(
        target.x + 930 * Math.cos(pitch) * Math.sin(currentAngle),
        target.y + 930 * Math.sin(pitch),
        target.z + 930 * Math.cos(pitch) * Math.cos(currentAngle),
      );
      camera.lookAt(target);
      camera.updateMatrixWorld();
      let horizontal = 0;
      let vertical = 0;
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) {
            sample.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
            horizontal = Math.max(horizontal, Math.abs(sample.x));
            vertical = Math.max(vertical, Math.abs(sample.y));
          }
      const aspect = width / height;
      const edge = Math.max(vertical, horizontal / aspect) * 1.09;
      camera.left = -edge * aspect;
      camera.right = -camera.left;
      camera.top = edge;
      camera.bottom = -edge;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      canvas.dataset.angle = currentAngle.toFixed(3);
      canvas.dataset.indoorFloor = String(floorNumber);
      canvas.dataset.routePoints = String(pointCount);
      for (const { anchor, element } of captions) {
        sample.copy(anchor.position).project(camera);
        element.style.left = `${50 + sample.x * 50}%`;
        element.style.top = `${50 - sample.y * 50}%`;
        element.style.visibility = "visible";
      }
      if (!drawn) {
        drawn = true;
        onStatus("ready");
      }
      if (progress < 1) schedule();
    }
    function resize() {
      const { clientWidth: width, clientHeight: height } = mount;
      if (!width || !height || lost) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio, width < 420 ? 1.5 : 1.8));
      renderer.setSize(width, height, false);
      schedule();
    }
    function removeModel() {
      if (model) {
        scene.remove(model.root);
        model.dispose();
      }
    }
    controls.current = {
      show(layout, part, destinationRoom) {
        removeModel();
        model = createIndoorFloor(layout, part, destinationRoom);
        scene.add(model.root);
        bounds.setFromObject(model.root);
        bounds.getCenter(target);
        floorNumber = layout.floor;
        pointCount = part?.points.length ?? 0;
        captions = model.labels.map((anchor) => {
          const element = document.createElement("span");
          element.className = "indoor-label";
          element.dataset.kind = anchor.kind;
          element.textContent = anchor.label;
          return { anchor, element };
        });
        layer.replaceChildren(...captions.map(({ element }) => element));
        schedule();
      },
      turn(angle) {
        if (angle === destination) return;
        fromAngle = currentAngle;
        destination = angle;
        started = drawn ? performance.now() : 0;
        schedule();
      },
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    function unavailable(event: Event) {
      event.preventDefault();
      lost = true;
      onStatus("unavailable");
    }
    canvas.addEventListener("webglcontextlost", unavailable);
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", schedule);
    return () => {
      controls.current = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      reduced.removeEventListener("change", schedule);
      document.removeEventListener("visibilitychange", schedule);
      canvas.removeEventListener("webglcontextlost", unavailable);
      removeModel();
      layer.replaceChildren();
      canvas.remove();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [onStatus]);

  useEffect(() => {
    controls.current?.show(floor, segment, room);
  }, [floor, segment, room]);
  useEffect(() => {
    controls.current?.turn(angle);
  }, [angle]);

  return (
    <>
      <div className="indoor-renderer" ref={host} aria-hidden="true" />
      <div className="indoor-labels" ref={labelLayer} aria-hidden="true" />
    </>
  );
}
