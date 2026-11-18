import { lazy, Suspense, useState } from "react";

export type CampusModel =
  | "campus"
  | "atrium"
  | "record"
  | "letter"
  | "bell"
  | "clip"
  | "archive";
const CampusCanvas = lazy(() => import("./campus-canvas"));

export function CampusObject({
  kind,
  animated = false,
}: {
  kind: CampusModel;
  animated?: boolean;
}) {
  const [ready, setReady] = useState<CampusModel | null>(null);
  return (
    <div
      className="campus-object"
      data-campus-model={kind}
      data-render={ready === kind ? "webgl" : "static"}
      aria-hidden="true"
    >
      <img
        className="campus-object-fallback"
        alt=""
        src={`/assets/campus-models/${kind}.webp`}
        width="900"
        height="400"
        decoding="async"
      />
      <Suspense fallback={null}>
        <CampusCanvas kind={kind} animated={animated} onFrame={setReady} />
      </Suspense>
    </div>
  );
}
