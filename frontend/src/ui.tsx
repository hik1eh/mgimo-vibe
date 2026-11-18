import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const change = () => setMatches(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [query]);
  return matches;
}

export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}

export function useResource<T>(path: string | null, poll = false) {
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    error: string;
  }>({ path, data: null, error: "" });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    window.addEventListener("session-restored", reload);
    return () => window.removeEventListener("session-restored", reload);
  }, [reload]);
  useEffect(() => {
    if (!path) return;
    let active = true;
    api<T>(path)
      .then((data) => {
        if (active) setState({ path, data, error: "" });
      })
      .catch((error) => {
        if (active) setState({ path, data: null, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [path, tick]);
  useEffect(() => {
    if (poll && path) {
      const timer = setInterval(reload, 15000);
      return () => clearInterval(timer);
    }
  }, [path, poll, reload]);
  return {
    data: state.path === path ? state.data : null,
    error: state.path === path ? state.error : "",
    reload,
  };
}
