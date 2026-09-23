import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, connect, type Agent, type Message, type ServerEvent, type Status, type ToolRun } from "./api.ts";
import { detectLang, I18n, translator, type Lang } from "./i18n.ts";
import { Sidebar } from "./components/Sidebar.tsx";
import { Chat, type Draft } from "./components/Chat.tsx";
import { AgentPanel } from "./components/AgentPanel.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { NewAgentDialog } from "./components/NewAgentDialog.tsx";
import { SettingsDialog } from "./components/SettingsDialog.tsx";

function routeAgent() {
  const m = location.hash.match(/^#\/agent\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function App() {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const t = useMemo(() => translator(lang), [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("crew.lang", l);
    } catch {}
  };

  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<string | null>(routeAgent);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [live, setLive] = useState(false);
  const [memoryTick, setMemoryTick] = useState(0);
  const [dialog, setDialog] = useState<"new" | "settings" | null>(null);
  const socket = useRef<ReturnType<typeof connect> | null>(null);

  const refreshAgents = useCallback(() => api.agents().then(setAgents).catch(() => {}), []);
  const refreshStatus = useCallback(() => api.status().then(setStatus).catch(() => setStatus(null)), []);

  useEffect(() => {
    refreshAgents();
    refreshStatus();
    const timer = setInterval(refreshStatus, 15_000);
    const onHash = () => setSelected(routeAgent());
    window.addEventListener("hashchange", onHash);
    return () => {
      clearInterval(timer);
      window.removeEventListener("hashchange", onHash);
    };
  }, [refreshAgents, refreshStatus]);

  const onEvent = useCallback(
    (e: ServerEvent) => {
      switch (e.type) {
        case "agents":
          refreshAgents();
          break;
        case "status":
          setAgents((list) => list.map((a) => (a.id === e.agentId ? { ...a, status: e.status } : a)));
          break;
        case "token":
          setDrafts((d) => {
            const cur = d[e.agentId];
            const base = cur?.replyId === e.replyId ? cur : { replyId: e.replyId, content: "", tools: [] };
            return { ...d, [e.agentId]: { ...base, content: base.content + e.delta } };
          });
          break;
        case "tool":
          setDrafts((d) => {
            const cur = d[e.agentId];
            const base = cur?.replyId === e.replyId ? cur : { replyId: e.replyId, content: "", tools: [] };
            const tools: ToolRun[] = e.result === undefined
              ? [...base.tools, { name: e.name, args: e.args }]
              : base.tools.map((t, i) => (i === base.tools.length - 1 ? { ...t, result: e.result } : t));
            return { ...d, [e.agentId]: { ...base, tools } };
          });
          break;
        case "message":
          setMessages((m) => {
            const list = m[e.agentId] ?? [];
            if (list.some((x) => x.id === e.message.id)) return m;
            const withoutPending = list.filter((x) => !(x.id.startsWith("pending-") && e.message.role === "user" && x.content === e.message.content));
            return { ...m, [e.agentId]: [...withoutPending, e.message] };
          });
          if (e.message.role === "assistant") {
            setDrafts((d) => {
              const { [e.agentId]: _, ...rest } = d;
              return rest;
            });
          }
          break;
        case "memory":
          setAgents((list) => list.map((a) => (a.id === e.agentId ? { ...a, memoryCount: a.memoryCount + 1 } : a)));
          setMemoryTick((n) => n + 1);
          break;
        case "error":
          setDrafts((d) => ({ ...d, [e.agentId]: { replyId: "error", content: `⚠️ ${e.message}`, tools: [], error: true } }));
          setAgents((list) => list.map((a) => (a.id === e.agentId ? { ...a, status: "idle" } : a)));
          break;
      }
    },
    [refreshAgents],
  );

  useEffect(() => {
    socket.current = connect(onEvent, setLive);
    return () => socket.current?.close();
  }, [onEvent]);

  const agent = agents.find((a) => a.id === selected || a.name === selected) ?? null;

  useEffect(() => {
    if (!agent || messages[agent.id]) return;
    api.messages(agent.id).then((r) => setMessages((m) => ({ ...m, [agent.id]: r.messages })));
  }, [agent, messages]);

  const select = (id: string | null) => {
    location.hash = id ? `#/agent/${encodeURIComponent(id)}` : "";
    setSelected(id);
  };

  const send = (text: string) => {
    if (!agent) return;
    const pending: Message = { id: `pending-${Date.now()}`, role: "user", content: text, meta: null, createdAt: Date.now() };
    setMessages((m) => ({ ...m, [agent.id]: [...(m[agent.id] ?? []), pending] }));
    setDrafts((d) => ({ ...d, [agent.id]: { replyId: "", content: "", tools: [] } }));
    socket.current?.send({ type: "chat", agentId: agent.id, text });
  };

  const clear = async () => {
    if (!agent) return;
    await api.clearMessages(agent.id);
    setMessages((m) => ({ ...m, [agent.id]: [] }));
  };

  return (
    <I18n.Provider value={{ lang, setLang, t }}>
      <div className="flex h-full overflow-hidden glow">
        <Sidebar
          agents={agents}
          selected={agent?.id ?? null}
          status={status}
          live={live}
          onSelect={select}
          onNew={() => setDialog("new")}
          onSettings={() => setDialog("settings")}
        />
        <main className="flex min-w-0 flex-1">
          {agent ? (
            <>
              <Chat
                agent={agent}
                messages={messages[agent.id] ?? []}
                draft={drafts[agent.id]}
                status={status}
                onSend={send}
                onClear={clear}
              />
              <AgentPanel
                key={agent.id}
                agent={agent}
                memoryTick={memoryTick}
                onChanged={refreshAgents}
                onDeleted={() => {
                  select(null);
                  refreshAgents();
                }}
              />
            </>
          ) : (
            <Dashboard agents={agents} status={status} onSelect={select} onNew={() => setDialog("new")} />
          )}
        </main>
      </div>
      {dialog === "new" && (
        <NewAgentDialog
          onClose={() => setDialog(null)}
          onCreated={(a) => {
            setDialog(null);
            refreshAgents().then(() => select(a.id));
          }}
        />
      )}
      {dialog === "settings" && (
        <SettingsDialog
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            refreshStatus();
            refreshAgents();
          }}
        />
      )}
    </I18n.Provider>
  );
}
