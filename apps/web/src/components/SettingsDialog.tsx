import { useEffect, useState } from "react";
import { api } from "../api.ts";
import { useT } from "../i18n.ts";
import { Button, Input, Label, Modal, cx } from "./ui.tsx";

export function SettingsDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const [s, setS] = useState<Record<string, string> | null>(null);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    api.settings().then(setS);
    api.status().then((st) => setModels(st.models.map((m) => m.name)));
  }, []);

  if (!s) return null;
  const set = (k: string) => (e: { target: { value: string } }) => setS({ ...s, [k]: e.target.value });

  return (
    <Modal title={t("settings")} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Label>{t("provider")}</Label>
          <div className="flex gap-2">
            {["ollama", "openai"].map((p) => (
              <button
                key={p}
                onClick={() => setS({ ...s, provider: p })}
                className={cx(
                  "flex-1 rounded-xl border px-3 py-2 text-sm",
                  s.provider === p ? "border-violet-500/60 bg-violet-500/10" : "border-line text-muted",
                )}
              >
                {p === "ollama" ? "Ollama" : "OpenAI-compatible"}
              </button>
            ))}
          </div>
        </div>
        {s.provider === "openai" ? (
          <>
            <div>
              <Label>{t("openaiBaseUrl")}</Label>
              <Input value={s.openaiBaseUrl} onChange={set("openaiBaseUrl")} placeholder="http://127.0.0.1:1234/v1" />
            </div>
            <div>
              <Label>{t("apiKey")}</Label>
              <Input type="password" value={s.openaiApiKey} onChange={set("openaiApiKey")} />
            </div>
          </>
        ) : (
          <div>
            <Label>{t("ollamaHost")}</Label>
            <Input value={s.ollamaHost} onChange={set("ollamaHost")} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("model")}</Label>
            <Input list="models" value={s.model} onChange={set("model")} className="font-mono" />
          </div>
          <div>
            <Label>{t("embedModel")}</Label>
            <Input list="models" value={s.embedModel} onChange={set("embedModel")} className="font-mono" />
          </div>
          <datalist id="models">
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>{t("telegramToken")}</Label>
          <Input type="password" value={s.telegramToken} onChange={set("telegramToken")} placeholder="123456:ABC…" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button variant="primary" onClick={() => api.saveSettings(s).then(onSaved)}>
            {t("save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
