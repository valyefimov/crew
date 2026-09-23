import { Brain, Plus } from "lucide-react";
import type { Agent, Status } from "../api.ts";
import { useT } from "../i18n.ts";
import { Avatar, Button, StatusText } from "./ui.tsx";

export function Dashboard({ agents, status, onSelect, onNew }: {
  agents: Agent[];
  status: Status | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const { t } = useT();
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
              {t("whoIsBusy")}
            </h1>
            <p className="mt-2 text-muted">{t("dashboardHint")}</p>
          </div>
          <Button variant="primary" onClick={onNew}>
            <Plus size={16} /> {t("newAgent")}
          </Button>
        </div>

        {agents.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-line p-16 text-center">
            <div className="text-5xl">👋</div>
            <div className="mt-4 text-lg font-medium">{t("noAgents")}</div>
            <div className="mt-1 text-sm text-muted">{t("noAgentsHint")}</div>
            <Button variant="primary" className="mt-6" onClick={onNew}>
              <Plus size={16} /> {t("newAgent")}
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelect(a.id)}
                className="group relative overflow-hidden rounded-3xl border border-line bg-panel/80 p-5 text-left transition hover:-translate-y-0.5 hover:border-white/20"
              >
                <div
                  className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-30 blur-3xl transition group-hover:opacity-50"
                  style={{ background: a.color }}
                />
                <div className="flex items-start gap-4">
                  <Avatar agent={a} size={52} />
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">{a.name}</div>
                    <div className="truncate text-sm text-muted">{a.role}</div>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-sm text-muted/90">{a.personality}</p>
                <div className="mt-4 flex items-center justify-between">
                  <StatusText status={a.status} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <Brain size={13} /> {a.memoryCount} {t("memories")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {status && (
          <div className="mt-12 flex flex-wrap gap-3 text-xs text-muted">
            <span className="rounded-full border border-line px-3 py-1.5">
              {status.online ? "🟢" : "🔴"} {status.provider} {status.online ? t("online") : ""}
            </span>
            <span className="rounded-full border border-line px-3 py-1.5 font-mono">{status.model}</span>
            <span className="rounded-full border border-line px-3 py-1.5 font-mono">{status.embedModel}</span>
            {status.telegram && <span className="rounded-full border border-line px-3 py-1.5">✈️ Telegram</span>}
            <span className="rounded-full border border-line px-3 py-1.5">v{status.version}</span>
          </div>
        )}
      </div>
    </div>
  );
}
