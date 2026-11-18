export type FloorPoint = [number, number];

export type FloorSpace = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  kind: "room" | "atrium" | "lift" | "stairs";
};

export type FloorLayout = {
  floor: number;
  plan: { width: number; height: number; spaces: FloorSpace[] };
};

export type FloorSegment = FloorLayout & {
  points: FloorPoint[];
  start: string;
  end: string;
  instruction: string;
};
