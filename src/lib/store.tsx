import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppState } from "../types";
import { applyCommand, type Command } from "./model";
import { readState, writeState } from "./db";
interface Store {
  state: AppState;
  run: (c: Command, message?: string) => Promise<boolean>;
  notify: (message: string) => void;
  busy: boolean;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [pending, setPending] = useState(0);
  const current = useRef<AppState | null>(null),
    queue = useRef(Promise.resolve()),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    readState()
      .then((s) => {
        current.current = s;
        setState(s);
      })
      .catch((e) => setError(String(e)));
    return () => clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    if (state) document.documentElement.dataset.theme = state.theme;
  }, [state]);
  // Other tabs are read-only to prevent stale snapshots overwriting changes.
  const [otherTab, setOtherTab] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let release: () => void = () => {};
    if (navigator.locks) {
      navigator.locks
        .request("usc-tracker-writer", { ifAvailable: true }, async (lock) => {
          if (!lock) {
            setOtherTab(true);
            return;
          }
          await new Promise<void>((resolve) => {
            release = resolve;
            if (cancelled) resolve();
          });
        })
        .catch(() => setOtherTab(true));
    }
    return () => {
      cancelled = true;
      release();
    };
  }, []);
  function notify(message: string) {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  }
  async function run(c: Command, message = "已保存到此浏览器") {
    if (otherTab) {
      notify("请关闭其他标签页并刷新此页后再编辑");
      return false;
    }
    setPending((n) => n + 1);
    let success = false;
    const job = queue.current.then(async () => {
      try {
        if (!current.current) throw Error("数据尚未加载");
        const next = applyCommand(current.current, c);
        await writeState(next);
        current.current = next;
        setState(next);
        notify(message);
        success = true;
      } catch (e) {
        notify(`保存失败：${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setPending((n) => n - 1);
      }
    });
    queue.current = job;
    await job;
    return success;
  }
  if (error)
    return (
      <main className="loading">
        <h1>无法读取本地数据库</h1>
        <p>
          数据未被覆盖。请确认浏览器允许 IndexedDB，或尝试退出隐私浏览模式。
        </p>
        <pre>{error}</pre>
        <button onClick={() => location.reload()}>重试</button>
      </main>
    );
  if (!state)
    return (
      <main className="loading">
        <div className="spinner" />
        <p>正在打开你的研究工作区…</p>
      </main>
    );
  return (
    <Context.Provider value={{ state, run, notify, busy: pending > 0 }}>
      {otherTab && (
        <div className="tab-warning" role="alert">
          另一个标签页正在使用此工作区。此页为只读；请关闭其他标签页后刷新。
        </div>
      )}
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw Error("Missing store provider");
  return store;
}
