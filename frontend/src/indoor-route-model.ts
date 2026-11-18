import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import type { FloorLayout, FloorPoint, FloorSegment, FloorSpace } from "./indoor-route-types";

const finishes = {
  plinth: 0x354f69,
  corridor: 0xc8d7e1,
  room: 0xe6ecf1,
  gallery: 0xc2d9da,
  target: 0xb6d6fa,
  wall: 0xecf2f7,
  edge: 0xa7bccb,
  frame: 0x416482,
  glass: 0x94b6cf,
  wood: 0xbe9976,
  seating: 0x426f88,
  metal: 0xa0bacd,
  cabin: 0x3e71a1,
  green: 0x628b7d,
};
type Finish = keyof typeof finishes;
export type FloorLabel = {
  label: string;
  position: Vector3;
  kind: "landmark" | "start" | "end";
};

export function createIndoorFloor(layout: FloorLayout, segment: FloorSegment | undefined, room: string) {
  const { plan, floor } = layout;
  const { spaces } = plan;
  const root = new Group();
  const temporary = new Object3D();
  const boxShape = new BoxGeometry(1, 1, 1);
  const disk = new CylinderGeometry(1, 1, 1, 32);
  const arrow = new BufferGeometry();
  arrow.setAttribute("position", new Float32BufferAttribute([
    -4.4, 0, -4, 4.4, 0, -4, 0, 0, 5,
  ], 3));
  const blue = new MeshBasicMaterial({ color: 0x125cbe });
  const white = new MeshBasicMaterial({ color: 0xeaf7ff, side: DoubleSide });
  const batches = new Map<Finish, ReturnType<typeof temporary.matrix.clone>[]>();
  const materials: MeshStandardMaterial[] = [];
  const labels: FloorLabel[] = [];
  const centerX = plan.width / 2;
  const centerZ = plan.height / 2;

  function box(finish: Finish, x: number, y: number, z: number, width: number, height: number, depth: number, yaw = 0, pitch = 0) {
    if (width <= 0 || depth <= 0) return;
    temporary.position.set(x - centerX, y, z - centerZ);
    temporary.scale.set(width, height, depth);
    temporary.rotation.set(pitch, yaw, 0);
    temporary.updateMatrix();
    const matrix = temporary.matrix.clone();
    const batch = batches.get(finish);
    if (batch) batch.push(matrix);
    else batches.set(finish, [matrix]);
  }
  function marker(label: string, [x, z]: FloorPoint, kind: FloorLabel["kind"], height: number) {
    labels.push({ label, position: new Vector3(x - centerX, height, z - centerZ), kind });
  }

  const minX = Math.min(...spaces.map((space) => space.x));
  const maxX = Math.max(...spaces.map((space) => space.x + space.width));
  const minZ = Math.min(...spaces.map((space) => space.y));
  const maxZ = Math.max(...spaces.map((space) => space.y + space.height));
  const floorX = (minX + maxX) / 2;
  const floorZ = (minZ + maxZ) / 2;
  box("plinth", floorX, -11, floorZ, maxX - minX + 12, 19, maxZ - minZ + 10);
  box("corridor", floorX, -1, floorZ, maxX - minX + 4, 3, maxZ - minZ + 4);
  if (floor === 1) {
    box("edge", floorX, -7, maxZ + 5, 88, 10, 28);
    box("corridor", floorX, -1, maxZ + 2, 82, 3, 26);
    for (const x of [floorX - 41, floorX + 41]) {
      box("frame", x, 16, maxZ + 3, 5, 36, 5);
    }
  }

  function furniture(space: FloorSpace, x: number, z: number) {
    if (space.kind === "lift") {
      box("metal", x, 32, z - 16, 42, 64, 35);
      box("cabin", x, 25, z + 2, 31, 46, 3);
      box("frame", x, 25, z + 4, 2, 46, 3);
      return;
    }
    if (space.kind === "stairs") {
      const depth = (space.height - 18) / 9;
      for (let step = 0; step < 9; step++) {
        const rise = 4 + step * 4.8;
        const tread = space.y + space.height - 10 - (step + 0.5) * depth;
        box("edge", x, rise / 2, tread, space.width * 0.66, rise, depth + 0.4);
        box("wall", x, rise + 0.6, tread, space.width * 0.66, 1.5, depth - 0.5);
      }
      for (const rail of [x - space.width * 0.31, x + space.width * 0.31]) {
        box("frame", rail, 19, space.y + space.height - 14, 2.6, 37, 2.6);
        box("frame", rail, 40, space.y + 13, 2.6, 70, 2.6);
        const run = space.height - 27;
        box("frame", rail, 56, z, 3, 3, Math.hypot(run, 37), 0, Math.atan2(37, run));
      }
      return;
    }
    if (space.kind === "atrium") {
      for (const offset of [-0.28, 0.28]) {
        const seatX = x + space.width * offset;
        box("wood", seatX, 5, z, 40, 8, 18);
        box("seating", seatX, 11, z, 40, 5, 19);
        box("seating", seatX, 17, z - 6, 40, 10, 5);
        box("edge", seatX, 5, z - 19, 10, 10, 10);
        box("green", seatX, 16, z - 19, 13, 16, 14, 0.62);
      }
      return;
    }
    if (!/^\d+$/.test(space.label)) {
      const width = Math.min(94, space.width - 32);
      box("frame", x, 8, z, width, 14, 21);
      box("wood", x, 17, z, width + 5, 4, 25);
      for (const offset of [-0.24, 0.24]) {
        box("frame", x + width * offset, 24, z - 4, 14, 11, 2);
      }
      return;
    }
    const columns = Math.max(1, Math.floor(space.width / 60));
    for (let col = 0; col < columns; col++) {
      const deskX = space.x + (col + 0.5) * space.width / columns;
      for (const row of [-21, 19]) {
        box("edge", deskX, 6, z + row, 23, 11, 9);
        box("wood", deskX, 13, z + row, 31, 3, 14);
        box("seating", deskX, 6, z + row + 13, 12, 5, 9);
        box("seating", deskX, 12, z + row + 16, 12, 11, 3);
      }
    }
    box("frame", x, 33, space.y + 5, Math.min(67, space.width - 22), 22, 2.5);
    box("wall", x, 33, space.y + 7, Math.min(62, space.width - 27), 17, 2);
  }

  const routeEnd = segment?.points.at(-1);
  for (const space of spaces) {
    const { x, y: z, width, height, label, kind } = space;
    const midX = x + width / 2;
    const midZ = z + height / 2;
    const north = z === minZ;
    const heightOfWall = north ? 57 : 27;
    const highlight = label === room;
    const facing = north ? z + height : z;
    const back = north ? z : z + height;
    const door = highlight && routeEnd ? routeEnd[0] : midX;
    const opening = kind === "lift" ? 41 : 29;
    const doorwayLeft = door - opening / 2;
    const doorwayRight = door + opening / 2;
    box(highlight ? "target" : kind === "atrium" ? "gallery" : "room", midX, 0.9, midZ, width - 3, 2.2, height - 3);
    box("wall", midX, heightOfWall / 2, back, width, heightOfWall, 4);
    // Adjacent rooms share a single partition.
    if (!spaces.some((neighbor) => neighbor.y === z && neighbor.x + neighbor.width === x))
      box("wall", x, heightOfWall / 2, midZ, 4, heightOfWall, height);
    box("wall", x + width, heightOfWall / 2, midZ, 4, heightOfWall, height);
    box("wall", (x + doorwayLeft) / 2, heightOfWall / 2, facing, doorwayLeft - x, heightOfWall, 4);
    box("wall", (doorwayRight + x + width) / 2, heightOfWall / 2, facing, x + width - doorwayRight, heightOfWall, 4);
    const trim = highlight || kind === "lift" ? "cabin" : "frame";
    for (const jamb of [doorwayLeft, doorwayRight])
      box(trim, jamb, heightOfWall / 2, facing, 3, heightOfWall, 6);
    if (north) box(trim, door, heightOfWall - 3, facing, opening + 4, 6, 6);
    box(trim, door, 2.5, facing, opening, 2.5, 7);
    if (kind === "lift") {
      box("frame", door, 24, facing - 3.5, opening, 47, 3);
      box("metal", door - 9.9, 24, facing - 1, 18, 44, 1.8);
      box("metal", door + 9.9, 24, facing - 1, 18, 44, 1.8);
      box("cabin", door + opening / 2 + 7, 30, facing + 3, 5, 14, 3);
      if (!segment) marker("Лифт", [door, facing], "start", 66);
    } else if (label !== room) {
      marker(label === "Стойка кампуса" ? "Стойка" : label, [midX, midZ], "landmark", north ? 61 : 36);
    }
    furniture(space, midX, midZ);
  }

  function round(mark: MeshBasicMaterial, [x, z]: FloorPoint, y: number, radius: number, thickness: number) {
    const mesh = new Mesh(disk, mark);
    mesh.position.set(x - centerX, y, z - centerZ);
    mesh.scale.set(radius, thickness, radius);
    root.add(mesh);
  }
  if (segment && segment.points.length > 1) {
    for (let index = 1; index < segment.points.length; index++) {
      const [x, z] = segment.points[index - 1];
      const [endX, endZ] = segment.points[index];
      const distance = Math.hypot(endX - x, endZ - z);
      if (!distance) continue;
      const yaw = Math.atan2(endX - x, endZ - z);
      for (const [material, width, elevation] of [[white, 13, 2.8], [blue, 8, 4.2]] as const) {
        const ribbon = new Mesh(boxShape, material);
        ribbon.position.set((x + endX) / 2 - centerX, elevation, (z + endZ) / 2 - centerZ);
        ribbon.scale.set(width, 1, distance);
        ribbon.rotation.y = yaw;
        root.add(ribbon);
      }
      const direction = new Mesh(arrow, white);
      direction.position.set((x + endX) / 2 - centerX, 5.2, (z + endZ) / 2 - centerZ);
      direction.rotation.y = yaw;
      root.add(direction);
    }
    for (const point of segment.points) {
      round(white, point, 2.8, 6.5, 1);
      round(blue, point, 4.2, 4, 1);
    }
    const start = segment.points[0];
    const end = segment.points.at(-1)!;
    round(blue, start, 6, 11, 4);
    round(white, start, 8.5, 7, 1);
    round(white, end, 6, 12, 4);
    round(blue, end, 8.5, 8, 1);
    marker(floor === 1 ? "Вход" : "Лифт", start, "start", floor === 1 ? 20 : 69);
    marker(floor === 1 ? "Лифт" : room, end, "end", 69);
  }

  for (const [finish, matrices] of batches) {
    const material = new MeshStandardMaterial({
      color: finishes[finish],
      roughness: finish === "metal" ? 0.32 : 0.72,
      metalness: finish === "metal" ? 0.24 : 0,
    });
    materials.push(material);
    const parts = new InstancedMesh(boxShape, material, matrices.length);
    matrices.forEach((matrix, index) => parts.setMatrixAt(index, matrix));
    parts.computeBoundingBox();
    parts.computeBoundingSphere();
    root.add(parts);
  }
  return {
    root,
    labels,
    dispose() {
      root.traverse((item) => {
        if (item instanceof InstancedMesh) item.dispose();
      });
      for (const geometry of [boxShape, disk, arrow]) geometry.dispose();
      for (const material of [...materials, blue, white]) material.dispose();
    },
  };
}
