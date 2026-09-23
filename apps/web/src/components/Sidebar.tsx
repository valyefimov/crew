import { LayoutGrid, Plus, Settings } from "lucide-react";
import type { Agent, Status } from "../api.ts";
import { useT, type Lang } from "../i18n.ts";
import { Avatar, Button, StatusDot, cx } from "./ui.tsx";

interface Props {
  agents: Agent[];
  selected: string | null;
  status: Status | null;
  live: boolean;
  onSelect: (id: string | null) => void;
  onNew: () => void;
  onSettings: () => void;
}

export function Sidebar({ agents, selected, status, live, onSelect, onNew, onSettings }: Props) {
  const { t, lang, setLang } = useT();
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-line bg-panel/70 backdrop-blur">
      <button className="flex items-center gap-3 px-5 pt-5 pb-4 text-left" onClick={() => onSelect(null)}>
        <img src="/logo.svg" alt="" className="h-9 w-9" />
        <div>
          <div className="text-lg font-semibold tracking-tight">Crew</div>
          <div className="text-xs text-muted">{t("tagline")}</div>
        </div>
      </button>

      <div className="px-3">
        <button
          onClick={() => onSelect(null)}
          className={cx(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
            selected === null ? "bg-white/8 text-text" : "text-muted hover:bg-white/5 hover:text-text",
          )}
        >
          <LayoutGrid size={16} /> {t("dashboard")}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between px-5 text-xs font-medium uppercase tracking-wider text-muted">
        <span>{t("crew")}</span>
        <span>{agents.length}</span>
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {agents.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={cx(
              "group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition",
              selected === a.id ? "bg-white/8" : "hover:bg-white/5",
            )}
          >
            <Avatar agent={a} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{a.name}</span>
                <StatusDot status={a.status} />
              </div>
              <div className="truncate text-xs text-muted">
                {a.status === "idle" ? a.role || "—" : t(a.status)}
              </div>
            </div>
          </button>
        ))}
        <Button variant="outline" className="mt-2 w-full border-dashed" onClick={onNew}>
          <Plus size={16} /> {t("newAgent")}
        </Button>
      </nav>

      <div className="space-y-3 border-t border-line p-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={cx("h-2 w-2 rounded-full", status?.online ? "bg-emerald-400" : "bg-red-400")} />
          <span className="truncate">
            {status?.provider ?? "…"} · {status?.model ?? "…"}
          </span>
          <span className="ml-auto">{live ? t("live") : t("reconnecting")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button className="flex-1 justify-start" onClick={onSettings}>
            <Settings size={16} /> {t("settings")}
          </Button>
          <div className="flex rounded-xl border border-line p-0.5 text-xs">
            {(["en", "ru", "uk"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cx("rounded-lg px-2 py-1 uppercase", lang === l ? "bg-white/10 text-text" : "text-muted")}
              >
                {l === "uk" ? "ua" : l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
