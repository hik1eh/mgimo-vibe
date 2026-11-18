import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
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

  function wing(
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    bays: number,
  ) {
    const group = subassembly(x, 0.32, z);
    // Window panels sit behind the stone mullions and roof slab.
    box(group, "stone", 0, h / 2, 0, w, h, d - 0.36);
    box(group, "glass", 0, h / 2, d / 2 - 0.14, w - 0.24, h - 0.35, 0.09);
    box(group, "glass", w / 2 + 0.018, h / 2, 0, 0.07, h - 0.36, d - 0.45);
    for (let j = 0; j <= bays; j++) {
      const at = (j / bays - 0.5) * (w - 0.12);
      box(
        group,
        "stone",
        at,
        h / 2,
        d / 2 - 0.01,
        j === 0 || j === bays ? 0.22 : 0.16,
        h,
        0.31,
      );
    }
    for (let j = 1; j < 4; j++) {
      box(group, "edge", w / 2, h / 2, (j / 4 - 0.5) * d, 0.18, h, 0.16);
    }
    for (let floor = 1; floor <= 2; floor++) {
      box(group, "edge", 0, (h * floor) / 3, d / 2, w, 0.12, 0.2);
    }
    box(group, "roof", 0, h + 0.08, 0, w + 0.25, 0.22, d + 0.25);
    box(group, "edge", 0, h + 0.22, -d / 2, w + 0.2, 0.12, 0.13);
  }

  if (kind === "campus") {
    box(root, "navy", 0, 0.12, 0, 12.2, 0.24, 6.35);
    box(root, "edge", 0, 0.26, 0, 12.06, 0.12, 6.22);
    wing(-4.15, -0.45, 3.3, 2.8, 3.65, 5);
    wing(-0.43, -0.33, 4.18, 3.45, 3.8, 6);
    wing(3.63, -0.19, 3.93, 3.13, 4.72, 5);
    const entry = subassembly(-0.43, 0.32, 1.84);
    box(entry, "navy", 0, 0.91, 0, 2.24, 1.82, 0.14);
    box(entry, "ice", 0, 0.94, 0.08, 1.6, 1.46, 0.09);
    box(entry, "navy", 0, 0.91, 0.15, 0.05, 1.5, 0.055);
    box(entry, "roof", 0, 1.93, 0.17, 3.04, 0.16, 1.47);
    for (const x of [-1.36, 1.36])
      box(entry, "stone", x, 0.97, 0.77, 0.18, 1.93, 0.2);
    for (let i = 0; i < 4; i++)
      box(
        entry,
        "stone",
        0,
        -0.26 + 0.074 * i,
        1.1 - 0.2 * i,
        3.45,
        0.15,
        1.25,
      );
    box(root, "edge", -0.5, 4.0, -1.14, 1.38, 0.34, 0.87);
    box(root, "roof", -0.5, 4.2, -1.14, 1.55, 0.13, 1.0);
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
    }
    box(root, "roof", 0, 2.45, -1.95, 8.35, 0.22, 1.05);
    for (const x of [-3.86, -2.22, 2.22, 3.86]) {
      box(root, "stone", x, 1.36, -1.74, 0.29, 2.22, 0.28);
      box(root, "stone", x, 3.37, -2.18, 0.22, 1.72, 0.23);
    }
    box(root, "glass", 0, 3.32, -2.25, 8.08, 1.6, 0.13);
    box(root, "edge", 0, 4.15, -2.18, 8.25, 0.2, 0.34);
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
      for (let i = 0; i < 6; i++)
        box(page, "rule", -0.02, 0.421, -0.82 + i * 0.44, 2.78, 0.016, 0.026);
      box(page, "rule", 0.76, 0.421, 0.32, 0.022, 0.016, 2.43);
    }
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
    box(sheet, "blue", -0.83, 1.13, 0.055, 1.0, 0.11, 0.015);
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
  } else if (kind === "bell") {
    const profile = [
      [0.05, 0.4],
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
    mesh(root, new SphereGeometry(0.32, 20, 14), "blue", 0, 0.23, 0);
    mesh(root, new TorusGeometry(0.31, 0.085, 12, 26), "metal", 0, 3.38, 0);
  } else if (kind === "clip") {
    box(root, "navy", 0, 1.5, -0.19, 1.05, 2.2, 0.17).rotation.z = -0.18;
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
  } else {
    box(root, "navy", 0, 1.5, 0, 5.34, 3.0, 2.17);
    box(root, "roof", 0, 3.04, 0, 5.6, 0.23, 2.39);
    for (let i = 0; i < 3; i++) {
      const y = 0.61 + 0.9 * i;
      box(root, i % 2 ? "edge" : "stone", 0, y, 1.15, 5.07, 0.78, 0.19);
      box(root, "metal", 0, y, 1.32, 1.36, 0.102, 0.15);
      box(root, "blue", -1.76, y, 1.27, 0.48, 0.22, 0.06);
    }
    box(root, "navy", 0, 0.13, 0, 5.49, 0.25, 2.28);
  }
  return root;
}

export function releaseGeometry(root: Group) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<MeshStandardMaterial>();
  root.traverse((node) => {
    if (node instanceof Mesh) {
      geometries.add(node.geometry);
      materials.add(node.material);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
