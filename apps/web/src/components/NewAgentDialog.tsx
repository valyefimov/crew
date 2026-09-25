import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { api, type Agent, type NewAgent } from "../api.ts";
import { useT } from "../i18n.ts";
import { Button, Input, Label, Modal, Textarea, cx } from "./ui.tsx";

const empty: NewAgent = { name: "", role: "", personality: "", systemPrompt: "", avatar: "🤖" };

export function NewAgentDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Agent) => void }) {
  const { t } = useT();
  const [templates, setTemplates] = useState<Record<string, NewAgent>>({});
  const [picked, setPicked] = useState<string>("blank");
  const [form, setForm] = useState<NewAgent>(empty);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.templates().then(setTemplates);
  }, []);

  const pick = (key: string) => {
    setPicked(key);
    setForm(key === "blank" ? empty : { ...empty, ...templates[key] });
  };
  const set = (k: keyof NewAgent) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const create = async () => {
    setError("");
    try {
      onCreated(await api.createAgent(form));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const importFile = async (f: File) => {
    try {
      onCreated(await api.importAgent(JSON.parse(await f.text())));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal title={t("newAgent")} onClose={onClose} wide>
      <Label>{t("templates")}</Label>
      <div className="mb-5 flex flex-wrap gap-2">
        {[["blank", { ...empty, name: t("blank"), avatar: "✨" }] as const, ...Object.entries(templates)].map(([key, tpl]) => (
          <button
            key={key}
            onClick={() => pick(key)}
            className={cx(
              "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
              picked === key ? "border-violet-500/60 bg-violet-500/10" : "border-line hover:bg-white/5",
            )}
          >
            <span className="text-lg">{tpl.avatar}</span>
            <span className="text-left">
              <span className="block font-medium leading-tight">{tpl.name}</span>
              {tpl.role && <span className="block text-xs leading-tight text-muted">{tpl.role}</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-[72px_1fr_1fr] gap-3">
          <div>
            <Label>{t("avatar")}</Label>
            <Input value={form.avatar} onChange={set("avatar")} className="text-center text-lg" />
          </div>
          <div>
            <Label>{t("name")}</Label>
            <Input autoFocus value={form.name} onChange={set("name")} placeholder="Artem" />
          </div>
          <div>
            <Label>{t("role")}</Label>
            <Input value={form.role} onChange={set("role")} placeholder="Backend engineer" />
          </div>
        </div>
        <div>
          <Label>{t("personality")}</Label>
          <Textarea rows={2} value={form.personality} onChange={set("personality")} />
        </div>
        <div>
          <Label>{t("instructions")}</Label>
          <Textarea rows={3} value={form.systemPrompt} onChange={set("systemPrompt")} />
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div className="flex items-center gap-2 pt-2">
          <input ref={file} type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          <Button variant="ghost" onClick={() => file.current?.click()}>
            <Upload size={14} /> {t("import")}
          </Button>
          <div className="flex-1" />
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button variant="primary" onClick={create} disabled={!form.name.trim()}>
            {t("create")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
