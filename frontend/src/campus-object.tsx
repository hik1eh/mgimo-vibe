import { lazy, Suspense, useState } from "react";

export type CampusModel =
  | "campus"
  | "atrium"
  | "record"
  | "letter"
  | "bell"
  | "clip"
  | "archive";
export type CampusView = "entrance" | "wing" | "courtyard";
const CampusCanvas = lazy(() => import("./campus-canvas"));

export function CampusObject({
  kind,
  animated = false,
  view,
}: {
  kind: CampusModel;
  animated?: boolean;
  view?: CampusView;
}) {
  const [ready, setReady] = useState<CampusModel | null>(null);
  return (
    <div
      className="campus-object"
      data-campus-model={kind}
      data-campus-view={view}
      data-render={ready === kind ? "webgl" : "static"}
      aria-hidden="true"
    >
      <img
        className="campus-object-fallback"
        alt=""
        src={`/assets/campus-models/${view ? `campus-${view}` : kind}.webp`}
        width="900"
        height="400"
        decoding="async"
      />
      <Suspense fallback={null}>
        <CampusCanvas kind={kind} animated={animated} view={view} onFrame={setReady} />
      </Suspense>
    </div>
  );
}
