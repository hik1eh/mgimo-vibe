import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}

export function useResource<T>(path: string, poll = false) {
  const [state, setState] = useState<{
    path: string;
    data: T | null;
    error: string;
  }>({ path, data: null, error: "" });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
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
    if (poll) {
      const timer = setInterval(reload, 15000);
      return () => clearInterval(timer);
    }
  }, [poll, reload]);
  return {
    data: state.path === path ? state.data : null,
    error: state.path === path ? state.error : "",
    reload,
  };
}
