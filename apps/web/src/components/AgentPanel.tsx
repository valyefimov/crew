import { useEffect, useState } from "react";
import { Download, FolderLock, FolderPen, Trash2, X } from "lucide-react";
import { api, type Agent, type Folder, type Memory } from "../api.ts";
import { useT } from "../i18n.ts";
import { Button, Input, Label, Textarea, cx } from "./ui.tsx";

type Tab = "memory" | "files" | "profile";

const typeStyle: Record<Memory["type"], string> = {
  fact: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
  decision: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  preference: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30",
  conversation: "text-zinc-300 bg-zinc-500/10 border-zinc-500/30",
};

function MemoryTab({ agent, tick }: { agent: Agent; tick: number }) {
  const { t } = useT();
  const [items, setItems] = useState<Memory[]>([]);
  const [q, setQ] = useState("");
  const [fact, setFact] = useState("");

  useEffect(() => {
    const id = setTimeout(() => api.memories(agent.id, q.trim() || undefined).then(setItems), q ? 250 : 0);
    return () => clearTimeout(id);
  }, [agent.id, q, tick]);

  const add = async () => {
    if (!fact.trim()) return;
    const m = await api.addMemory(agent.id, fact.trim());
    setItems((list) => [m, ...list.filter((x) => x.id !== m.id)]);
    setFact("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 p-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchMemory")} />
        <div className="flex gap-2">
          <Input value={fact} onChange={(e) => setFact(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("addMemory")} />
          <Button variant="outline" onClick={add}>
            {t("add")}
          </Button>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {items.length === 0 && <div className="py-10 text-center text-sm text-muted">{t("noMemories")}</div>}
        {items.map((m) => (
          <div key={m.id} className="group rounded-2xl border border-line bg-panel-2/60 p-3">
            <div className="text-sm leading-relaxed">{m.content}</div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
              <span className={cx("rounded-full border px-2 py-0.5", typeStyle[m.type])}>{m.type}</span>
              <span className="flex gap-0.5" title={`importance ${m.importance.toFixed(2)}`}>
                {[0.2, 0.4, 0.6, 0.8, 1].map((s) => (
                  <span key={s} className={cx("h-1.5 w-1.5 rounded-full", m.importance >= s - 0.1 ? "bg-violet-400" : "bg-white/10")} />
                ))}
              </span>
              <span>{m.source}</span>
              <span className="ml-auto">{new Date(m.createdAt).toLocaleDateString()}</span>
              <button
                className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                onClick={() => api.deleteMemory(m.id).then(() => setItems((l) => l.filter((x) => x.id !== m.id)))}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilesTab({ agent }: { agent: Agent }) {
  const { t } = useT();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [path, setPath] = useState("");
  const [mode, setMode] = useState<"ro" | "rw">("ro");
  const [error, setError] = useState("");

  useEffect(() => {
    api.folders(agent.id).then(setFolders);
  }, [agent.id]);

  const add = async () => {
    setError("");
    try {
      await api.addFolder(agent.id, path.trim(), mode);
      setFolders(await api.folders(agent.id));
      setPath("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label>{t("sharedFolders")}</Label>
        <p className="text-xs text-muted">{t("folderHint")}</p>
      </div>
      <div className="space-y-2">
        {folders.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel-2/60 p-3">
            {f.mode === "rw" ? <FolderPen size={16} className="text-emerald-300" /> : <FolderLock size={16} className="text-cyan-300" />}
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-xs">{f.path}</div>
              <div className="text-[11px] text-muted">{f.mode === "rw" ? t("readWrite") : t("readOnly")}</div>
            </div>
            <button className="text-muted hover:text-red-400" onClick={() => api.removeFolder(f.id).then(() => setFolders((l) => l.filter((x) => x.id !== f.id)))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder={t("folderPath")} className="font-mono" />
        <div className="flex gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "ro" | "rw")}
            className="flex-1 rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm"
          >
            <option value="ro">{t("readOnly")}</option>
            <option value="rw">{t("readWrite")}</option>
          </select>
          <Button variant="outline" onClick={add} disabled={!path.trim()}>
            {t("add")}
          </Button>
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>
    </div>
  );
}

function ProfileTab({ agent, onChanged, onDeleted }: { agent: Agent; onChanged: () => void; onDeleted: () => void }) {
  const { t } = useT();
  const [form, setForm] = useState(agent);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof Agent) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    await api.updateAgent(agent.id, {
      name: form.name,
      role: form.role,
      personality: form.personality,
      systemPrompt: form.systemPrompt,
      avatar: form.avatar,
      model: form.model || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onChanged();
  };

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div className="grid grid-cols-[64px_1fr] gap-3">
        <div>
          <Label>{t("avatar")}</Label>
          <Input value={form.avatar} onChange={set("avatar")} className="text-center text-lg" />
        </div>
        <div>
          <Label>{t("name")}</Label>
          <Input value={form.name} onChange={set("name")} />
        </div>
      </div>
      <div>
        <Label>{t("role")}</Label>
        <Input value={form.role} onChange={set("role")} />
      </div>
      <div>
        <Label>{t("personality")}</Label>
        <Textarea rows={3} value={form.personality} onChange={set("personality")} />
      </div>
      <div>
        <Label>{t("instructions")}</Label>
        <Textarea rows={4} value={form.systemPrompt} onChange={set("systemPrompt")} />
      </div>
      <div>
        <Label>{t("model")}</Label>
        <Input value={form.model ?? ""} onChange={set("model")} placeholder={t("defaultModel", { model: agent.effectiveModel })} className="font-mono" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={save}>
          {saved ? t("saved") : t("save")}
        </Button>
        <a href={api.exportUrl(agent.id)} download={`${agent.name}.crew.json`}>
          <Button variant="outline">
            <Download size={14} /> {t("export")}
          </Button>
        </a>
        <Button
          variant="danger"
          className="ml-auto"
          onClick={async () => {
            if (!confirm(t("deleteConfirm", { name: agent.name }))) return;
            await api.deleteAgent(agent.id);
            onDeleted();
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

export function AgentPanel({ agent, memoryTick, onChanged, onDeleted }: {
  agent: Agent;
  memoryTick: number;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("memory");
  return (
    <aside className="hidden w-96 shrink-0 flex-col border-l border-line bg-panel/60 backdrop-blur xl:flex">
      <div className="flex gap-1 border-b border-line p-2">
        {(["memory", "files", "profile"] as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cx(
              "flex-1 rounded-xl px-3 py-2 text-sm transition",
              tab === k ? "bg-white/8 text-text" : "text-muted hover:text-text",
            )}
          >
            {t(k)}
            {k === "memory" && <span className="ml-1.5 rounded-full bg-violet-500/20 px-1.5 text-xs text-violet-200">{agent.memoryCount}</span>}
          </button>
        ))}
      </div>
      {tab === "memory" && <MemoryTab agent={agent} tick={memoryTick} />}
      {tab === "files" && <FilesTab agent={agent} />}
      {tab === "profile" && <ProfileTab agent={agent} onChanged={onChanged} onDeleted={onDeleted} />}
    </aside>
  );
}
