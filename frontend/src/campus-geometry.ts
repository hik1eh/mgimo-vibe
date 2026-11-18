import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  type BufferGeometry,
} from "three";
import type { CampusModel } from "./campus-object";

// Original geometry for the fictional university. Dimensions are scene units.
export function campusGeometry(kind: CampusModel) {
  const root = new Group();
  const materials = new Map<string, MeshStandardMaterial>();
  const palette = {
    stone: "#ece9e0",
    edge: "#adbfcf",
    roof: "#f5f6f0",
    navy: "#203d57",
    glass: "#527c9e",
    ice: "#8bc0df",
    paper: "#fcf7e8",
    rule: "#9fbbd3",
    metal: "#c5d3df",
    blue: "#32649b",
    seal: "#7fa4c4",
    shadow: "#182d40",
    tint: "#6689a4",
    warm: "#c4ad82",
    paving: "#d6dce1",
    lawn: "#6c8578",
    pine: "#315f59",
    needles: "#578471",
    wood: "#ac8961",
  };
  type Finish = keyof typeof palette;
  const blocks = new BoxGeometry(1, 1, 1);
  const mesh = (
    group: Group,
    shape: BufferGeometry,
    finish: Finish,
    x: number,
    y: number,
    z: number,
  ) => {
    let material = materials.get(finish);
    if (!material) {
      const polished = finish === "metal" || finish === "glass";
      material = new MeshStandardMaterial({
        color: palette[finish],
        roughness: polished ? 0.32 : 0.68,
        metalness: finish === "metal" ? 0.36 : polished ? 0.16 : 0,
        side: DoubleSide,
      });
      materials.set(finish, material);
    }
    const object = new Mesh(shape, material);
    object.position.set(x, y, z);
    group.add(object);
    return object;
  };
  const box = (
    group: Group,
    finish: Finish,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) => {
    const object = mesh(group, blocks, finish, x, y, z);
    object.scale.set(w, h, d);
    return object;
  };
  const subassembly = (x = 0, y = 0, z = 0) => {
    const group = new Group();
    group.position.set(x, y, z);
    root.add(group);
    return group;
  };
  const stud = new SphereGeometry(1, 12, 8);

  function line(group: Group, finish: Finish, a: [number, number], b: [number, number], z: number) {
    const mark = box(group, finish, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z,
      Math.hypot(b[0] - a[0], b[1] - a[1]), 0.027, 0.025);
    mark.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  function wing(
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rows: number,
  ) {
    const group = subassembly(x, 0.34, z);
    box(group, "stone", 0, h / 2, 0, w - 0.21, h, d - 0.21);
    box(group, "edge", 0, 0.09, 0, w + 0.05, 0.18, d + 0.05);
    for (let side = 0; side < 4; side++) {
      const facade = new Group();
      facade.rotation.y = side * Math.PI / 2;
      group.add(facade);
      const width = side % 2 ? d : w;
      const front = (side % 2 ? w : d) / 2;
      const columns = Math.round(width / 0.71);
      const bay = (width - 0.24) / columns;
      const storey = (h - 0.32) / rows;
      for (let col = 0; col < columns; col++) {
        const at = -width / 2 + 0.12 + (col + 0.5) * bay;
        for (let row = 0; row < rows; row++) {
          const y = 0.16 + (row + 0.5) * storey;
          const glazing = (col + row * 3 + side) % 11 === 6 ? "warm" : row % 2 ? "glass" : "tint";
          box(facade, "shadow", at, y, front - 0.054, bay - 0.10, storey - 0.13, 0.09);
          box(facade, glazing, at, y, front - 0.001, bay - 0.15, storey - 0.20, 0.028);
          box(facade, "navy", at, y, front + 0.019, 0.027, storey - 0.17, 0.027);
          box(facade, "navy", at, y - storey * 0.16, front + 0.019, bay - 0.16, 0.029, 0.027);
          box(facade, "edge", at, y - storey / 2 + 0.035, front + 0.041, bay - 0.02, 0.065, 0.11);
        }
        box(facade, "stone", at - bay / 2, h / 2, front + 0.042, 0.115, h, 0.18);
      }
      box(facade, "stone", width / 2 - 0.12, h / 2, front + 0.042, 0.15, h, 0.18);
      box(facade, "edge", 0, h + 0.28, front, width + 0.16, 0.14, 0.09);
    }
    box(group, "roof", 0, h + 0.08, 0, w + 0.25, 0.22, d + 0.25);
    box(group, "navy", 0, h + 0.21, 0, w - 0.43, 0.045, d - 0.43);
    for (const offset of [-0.58, 0.58]) {
      box(group, "edge", offset, h + 0.36, -d * 0.17, 0.74, 0.27, 0.49);
      for (let slat = 0; slat < 5; slat++)
        box(group, "navy", offset - 0.26 + 0.13 * slat, h + 0.505, -d * 0.17, 0.04, 0.018, 0.36);
    }
  }

  if (kind === "campus") {
    box(root, "navy", 0, 0.105, 0, 13.2, 0.21, 8.55);
    box(root, "paving", 0, 0.245, 0, 13.05, 0.16, 8.4);
    wing(-4.48, -0.72, 3.52, 3.17, 5.2, 3);
    wing(0, 0.59, 5.54, 4.01, 3.7, 4);
    wing(4.52, -0.45, 3.57, 3.55, 5.82, 4);
    for (const side of [-1, 1]) {
      const entry = subassembly(0, 0.34, side === 1 ? 2.46 : -1.31);
      if (side === -1) entry.rotation.y = Math.PI;
      box(entry, "shadow", 0, 0.87, 0.03, 2.35, 1.74, 0.20);
      box(entry, "ice", 0, 0.89, 0.155, 2.2, 1.5, 0.08);
      for (const offset of [-0.73, 0, 0.73]) {
        box(entry, "navy", offset, 0.89, 0.209, 0.06, 1.52, 0.06);
        box(entry, "metal", offset + 0.13, 0.76, 0.23, 0.16, 0.045, 0.04);
      }
      box(entry, "roof", 0, 1.82, 0.43, 3.48, 0.16, 1.37);
      box(entry, "navy", 0, 1.73, 1.02, 3.26, 0.10, 0.04);
      for (const x of [-1.54, 1.54])
        box(entry, "stone", x, 0.91, 0.88, 0.18, 1.82, 0.19);
      for (let i = 0; i < 4; i++)
        box(entry, i % 2 ? "paving" : "edge", 0, i * 0.053 - 0.01, 0.95 - i * 0.16, 3.48, 0.09, 1.20);
    }
    for (const x of [-4.42, 4.52]) {
      box(root, "edge", x, 0.369, 3.08, 2.72, 0.22, 1.25);
      box(root, "lawn", x, 0.491, 3.08, 2.55, 0.065, 1.06);
    }
    for (const x of [-1.91, 1.91]) {
      box(root, "lawn", x, 0.362, -2.88, 0.81, 0.12, 1.61);
      for (const offset of [-0.49, 0, 0.49]) {
        const shrub = mesh(root, stud, "needles", x, 0.46, -2.88 + offset);
        shrub.scale.set(0.31, 0.24, 0.24);
      }
      box(root, "wood", x, 0.57, -1.87, 0.85, 0.09, 0.31);
      for (const leg of [-0.30, 0.30])
        box(root, "navy", x + leg, 0.449, -1.87, 0.06, 0.24, 0.24);
    }
    for (let step = 0; step < 9; step++)
      box(root, "edge", 0, 0.327, -3.89 + 0.37 * step, 2.0, 0.018, 0.035);
    for (const [x, z, height] of [[-5.30, 3.18, 1.44], [-3.62, 3.13, 1.21], [4.30, 3.09, 1.56], [5.33, 3.31, 1.14]]) {
      box(root, "wood", x, 0.86, z, 0.085, 0.85, 0.08);
      const foliage = mesh(root, stud, "pine", x, 0.94 + height * 0.30, z);
      foliage.scale.set(0.42, height * 0.39, 0.36);
      mesh(root, stud, "needles", x - 0.18, 1.07 + height * 0.37, z + 0.1).scale.set(0.31, 0.42, 0.31);
    }
    for (const x of [-2.51, 2.51]) {
      box(root, "navy", x, 0.85, 3.52, 0.05, 1.03, 0.05);
      box(root, "paper", x, 1.39, 3.52, 0.13, 0.16, 0.13);
      box(root, "navy", x, 1.47, 3.52, 0.19, 0.05, 0.19);
    }

    const label = document.createElement("canvas");
    label.width = 768;
    label.height = 88;
    const ink = label.getContext("2d")!;
    ink.fillStyle = "#20394e";
    ink.fillRect(0, 0, label.width, label.height);
    ink.fillStyle = "#e9f4fd";
    ink.font = "600 42px Arial, sans-serif";
    ink.textAlign = "center";
    ink.textBaseline = "middle";
    ink.fillText("СК   ·   СЕВЕРНЫЙ КАМПУС", 384, 46);
    const nameplate = new CanvasTexture(label);
    nameplate.colorSpace = SRGBColorSpace;
    const sign = new Mesh(new PlaneGeometry(2.91, 0.32),
      new MeshStandardMaterial({ map: nameplate, roughness: 0.68 }));
    sign.position.set(0, 2.48, 2.67);
    root.add(sign);
  } else if (kind === "atrium") {
    box(root, "navy", 0, 0.13, 0, 8.5, 0.23, 5.1);
    box(root, "stone", 0, 0.28, 0, 8.36, 0.13, 4.98);
    const steps = subassembly(0, 0.35, 0);
    for (let i = 0; i < 9; i++) {
      box(
        steps,
        i % 2 === 0 ? "stone" : "edge",
        0,
        0.12 * (i + 1),
        1.69 - i * 0.36,
        4.05,
        0.25 + i * 0.24,
        0.4,
      );
      box(steps, "navy", 0, 0.239 + i * 0.24, 1.883 - i * 0.36, 4.07, 0.022, 0.049);
    }
    box(root, "roof", 0, 2.45, -1.95, 8.35, 0.22, 1.05);
    for (const x of [-3.86, -2.22, 2.22, 3.86]) {
      box(root, "stone", x, 1.36, -1.74, 0.29, 2.22, 0.28);
      box(root, "stone", x, 3.37, -2.18, 0.22, 1.72, 0.23);
    }
    box(root, "glass", 0, 3.32, -2.25, 8.08, 1.6, 0.13);
    box(root, "edge", 0, 4.15, -2.18, 8.25, 0.2, 0.34);
    for (let j = 0; j < 8; j++) {
      const x = -3.83 + j * 1.09;
      box(root, "navy", x, 3.35, -2.16, 0.065, 1.54, 0.067);
      box(root, "ice", x + 0.37, 4.27, -1.41, 0.72, 0.055, 1.43).rotation.x = -0.08;
    }
    box(root, "navy", 0, 3.14, -2.15, 8.09, 0.055, 0.077);
    box(root, "metal", 0, 4.31, -0.69, 8.23, 0.07, 0.07);
    for (const x of [-2.15, 2.15]) {
      const rail = box(root, "metal", x, 1.88, 0.24, 0.095, 0.12, 3.78);
      rail.rotation.x = 0.53;
      for (let i = 0; i < 4; i++)
        box(
          root,
          "edge",
          x,
          0.91 + i * 0.49,
          1.64 - i * 0.88,
          0.075,
          0.98,
          0.078,
        );
      box(root, "blue", x * 1.51, 0.48, 1.11, 1.49, 0.19, 0.57);
      box(root, "navy", x * 1.51, 0.69, 0.87, 1.49, 0.34, 0.16);
      for (const sign of [-1, 1])
        box(root, "metal", x * 1.51 + sign * 0.53, 0.385, 1.11, 0.07, 0.2, 0.55);
    }
  } else if (kind === "record") {
    for (const side of [-1, 1]) {
      const page = subassembly(side * 1.77, 0.43, 0);
      page.rotation.z = side * 0.1;
      page.rotation.x = 0.12;
      box(page, "navy", 0, 0.02, 0, 3.75, 0.19, 4.52);
      for (let i = 0; i < 6; i++)
        box(
          page,
          i % 2 ? "stone" : "paper",
          0,
          0.13 + i * 0.051,
          -0.04,
          3.51,
          0.054,
          4.26,
        );
      box(page, "blue", -0.16, 0.425, -1.39, 2.35, 0.024, 0.085);
      box(page, "seal", -0.52, 0.424, -1.16, 1.59, 0.021, 0.045);
      box(page, "metal", 0, 0.103, 2.16, 3.46, 0.023, 0.026);
      for (let i = 0; i < 6; i++)
        box(page, "rule", -0.02, 0.421, -0.82 + i * 0.44, 2.78, 0.016, 0.026);
      box(page, "rule", 0.76, 0.421, 0.32, 0.022, 0.016, 2.43);
      for (let row = 0; row < 5; row++) {
        box(page, "tint", -0.65 + 0.1 * (row % 3), 0.423, -0.59 + row * 0.44, 0.93 + 0.1 * row, 0.014, 0.025);
        box(page, "tint", 0.98, 0.424, -0.59 + row * 0.44, 0.19, 0.014, 0.026);
      }
    }
    box(root, "blue", 0, 0.446, 0, 0.15, 0.12, 4.1);
    box(root, "blue", 0.15, 0.37, 2.1, 0.29, 0.05, 1.16).rotation.x = 0.28;
    root.rotation.x = 0.18;
  } else if (kind === "letter") {
    const envelope = subassembly(0, 1.62, 0);
    envelope.rotation.y = -0.12;
    envelope.rotation.x = -0.075;
    const polygon = (
      coords: number[][],
      finish: Finish,
      z: number,
      depth: number,
    ) => {
      const shape = new Shape(coords.map(([x, y]) => new Vector2(x, y)));
      return mesh(
        envelope,
        new ExtrudeGeometry(shape, { depth, bevelEnabled: false }),
        finish,
        0,
        0,
        z,
      );
    };
    box(envelope, "edge", 0, 0, -0.2, 5.8, 3.14, 0.17);
    polygon(
      [
        [-2.9, 1.55],
        [0, 3.25],
        [2.9, 1.55],
      ],
      "edge",
      -0.27,
      0.055,
    );
    const sheet = new Group();
    sheet.rotation.z = -0.085;
    sheet.position.set(0.12, 1.15, 0.015);
    envelope.add(sheet);
    box(sheet, "paper", 0, 0, 0, 3.7, 3.75, 0.095);
    mesh(sheet, new TorusGeometry(0.275, 0.025, 8, 30), "blue", -1.02, 1.12, 0.062);
    box(sheet, "seal", -1.02, 1.12, 0.056, 0.33, 0.09, 0.022);
    box(sheet, "blue", 0.41, 1.26, 0.055, 1.75, 0.065, 0.018);
    box(sheet, "rule", 0.16, 1.03, 0.055, 1.27, 0.034, 0.018);
    for (let i = 0; i < 4; i++)
      box(sheet, "rule", -0.08, 0.7 - i * 0.32, 0.055, 2.63, 0.035, 0.012);
    polygon(
      [
        [-2.9, -1.55],
        [-2.9, 1.55],
        [0.63, -0.39],
      ],
      "stone",
      0.18,
      0.075,
    );
    polygon(
      [
        [2.9, -1.55],
        [2.9, 1.55],
        [-0.63, -0.39],
      ],
      "roof",
      0.18,
      0.077,
    );
    polygon(
      [
        [-2.9, -1.55],
        [0, 0.05],
        [2.9, -1.55],
      ],
      "paper",
      0.28,
      0.07,
    );
    line(envelope, "edge", [-2.84, -1.49], [-0.13, -0.16], 0.366);
    line(envelope, "edge", [2.84, -1.49], [0.13, -0.16], 0.366);
  } else if (kind === "bell") {
    const profile = [
      [0.16, 2.91],
      [0.81, 2.59],
      [1.07, 2.07],
      [1.25, 1.13],
      [1.57, 0.67],
      [1.77, 0.45],
      [1.92, 0.4],
      [1.94, 0.61],
      [1.73, 0.71],
      [1.4, 1.11],
      [1.22, 2.12],
      [0.92, 2.72],
      [0.5, 3.02],
      [0.08, 3.14],
    ].map(([x, y]) => new Vector2(x, y));
    mesh(root, new LatheGeometry(profile, 48), "metal", 0, 0, 0);
    mesh(
      root,
      new TorusGeometry(1.87, 0.09, 10, 44),
      "blue",
      0,
      0.52,
      0,
    ).rotation.x = Math.PI / 2;
    mesh(root, new TorusGeometry(1.58, 0.048, 8, 44), "edge", 0, 0.91, 0).rotation.x = Math.PI / 2;
    mesh(root, stud, "blue", 0, 0.24, 0).scale.setScalar(0.32);
    mesh(root, new CylinderGeometry(0.075, 0.075, 0.59, 12), "edge", 0, 0.61, 0);
    mesh(root, new CylinderGeometry(0.197, 0.29, 0.28, 18), "blue", 0, 3.07, 0);
    mesh(root, new TorusGeometry(0.31, 0.085, 12, 26), "metal", 0, 3.38, 0);
  } else if (kind === "clip") {
    const strap = subassembly(0, 1.56, -0.19);
    strap.rotation.z = -0.18;
    box(strap, "navy", 0, 0, 0, 1.05, 2.2, 0.17);
    for (const edge of [-0.4, 0.4]) {
      for (let i = 0; i < 10; i++)
        box(strap, "tint", edge, i * 0.2 - 0.9, 0.09, 0.023, 0.11, 0.013);
    }
    mesh(
      root,
      new TorusGeometry(0.69, 0.13, 16, 30),
      "metal",
      0,
      0.93,
      0,
    ).scale.y = 0.78;
    mesh(
      root,
      new TorusGeometry(0.39, 0.105, 14, 25),
      "metal",
      0.13,
      0.31,
      0.1,
    ).rotation.y = 0.24;
    mesh(
      root,
      new CylinderGeometry(0.16, 0.17, 0.65, 18),
      "edge",
      0.45,
      0.44,
      0.12,
    ).rotation.z = -0.17;
    mesh(root, stud, "metal", 0.40, 0.66, 0.245).scale.setScalar(0.13);
    box(root, "metal", 0, 1.42, -0.10, 1.15, 0.23, 0.24);
  } else {
    box(root, "navy", 0, 1.5, 0, 5.34, 3.0, 2.17);
    box(root, "roof", 0, 3.04, 0, 5.6, 0.23, 2.39);
    for (let i = 0; i < 3; i++) {
      const y = 0.61 + 0.9 * i;
      box(root, i % 2 ? "edge" : "stone", 0, y, 1.15, 5.07, 0.78, 0.19);
      box(root, "navy", 0, y + 0.07, 1.27, 1.38, 0.24, 0.05);
      box(root, "metal", 0, y, 1.36, 1.36, 0.084, 0.12);
      box(root, "blue", -1.75, y + 0.071, 1.27, 0.6, 0.27, 0.04);
      box(root, "paper", -1.75, y + 0.071, 1.30, 0.50, 0.16, 0.021);
      for (const x of [-2.26, 2.26])
        mesh(root, stud, "metal", x, y, 1.27).scale.setScalar(0.038);
    }
    box(root, "navy", 0, 0.13, 0, 5.49, 0.25, 2.28);
  }
  // Batch the repeated stone and glazing details without merging material finishes.
  root.updateMatrixWorld(true);
  const boxBatches = new Map<MeshStandardMaterial, Mesh[]>();
  root.traverse((node) => {
    if (!(node instanceof Mesh) || node.geometry !== blocks) return;
    const list = boxBatches.get(node.material) ?? [];
    list.push(node);
    boxBatches.set(node.material, list);
  });
  const local = root.matrixWorld.clone().invert();
  const matrix = new Matrix4();
  for (const [material, objects] of boxBatches) {
    if (objects.length < 2) continue;
    const detailed = new InstancedMesh(blocks, material, objects.length);
    objects.forEach((object, index) => {
      detailed.setMatrixAt(index, matrix.multiplyMatrices(local, object.matrixWorld));
      object.removeFromParent();
    });
    detailed.computeBoundingBox();
    detailed.computeBoundingSphere();
    root.add(detailed);
  }
  if (kind !== "campus" && kind !== "bell" && kind !== "clip" && kind !== "archive") stud.dispose();
  if (!boxBatches.size) blocks.dispose();
  return root;
}

export function releaseGeometry(root: Group) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<MeshStandardMaterial>();
  root.traverse((node) => {
    if (node instanceof Mesh) {
      geometries.add(node.geometry);
      materials.add(node.material);
      if (node instanceof InstancedMesh) node.dispose();
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    material.map?.dispose();
    material.dispose();
  });
}
