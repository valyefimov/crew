import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, FileText, FolderOpen, PenLine, Search, Trash2, Wrench } from "lucide-react";
import type { Agent, Message, Status, ToolRun } from "../api.ts";
import { useT } from "../i18n.ts";
import { Markdown } from "./Markdown.tsx";
import { Avatar, Button, StatusText, cx } from "./ui.tsx";

export interface Draft {
  replyId: string;
  content: string;
  tools: ToolRun[];
  error?: boolean;
}

const toolIcon: Record<string, typeof Wrench> = {
  remember: Brain,
  recall: Search,
  list_files: FolderOpen,
  read_file: FileText,
  write_file: PenLine,
};

function ToolChips({ tools }: { tools: ToolRun[] }) {
  const { t } = useT();
  if (!tools.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {tools.map((tool, i) => {
        const Icon = toolIcon[tool.name] ?? Wrench;
        const args = tool.args as Record<string, unknown>;
        const detail = String(args?.path ?? args?.content ?? args?.query ?? "");
        return (
          <span
            key={i}
            title={tool.result}
            className={cx(
              "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
              tool.name === "remember" ? "border-violet-500/40 bg-violet-500/10 text-violet-200" : "border-line bg-white/5 text-muted",
              tool.result === undefined && "animate-pulse",
            )}
          >
            <Icon size={12} />
            <span className="font-mono">{tool.name === "remember" ? t("savedToMemory") : `${t("usedTool")} ${tool.name}`}</span>
            {detail && <span className="truncate opacity-70">· {detail.slice(0, 60)}</span>}
          </span>
        );
      })}
    </div>
  );
}

function Bubble({ agent, role, content, tools, streaming, error }: {
  agent: Agent;
  role: Message["role"];
  content: string;
  tools?: ToolRun[];
  streaming?: boolean;
  error?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 py-2.5 text-[15px] text-white shadow-lg shadow-violet-900/30">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <Avatar agent={{ ...agent, status: "idle" }} size={34} />
      <div className={cx("min-w-0 max-w-[80%] pt-1", error && "text-red-300")}>
        <ToolChips tools={tools ?? []} />
        {content ? (
          <Markdown>{content + (streaming ? " ▍" : "")}</Markdown>
        ) : (
          streaming && (
            <div className="flex gap-1 pt-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot h-2 w-2 rounded-full bg-muted" />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

interface Props {
  agent: Agent;
  messages: Message[];
  draft?: Draft;
  status: Status | null;
  onSend: (text: string) => void;
  onClear: () => void;
}

export function Chat({ agent, messages, draft, status, onSend, onClear }: Props) {
  const { t } = useT();
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const busy = Boolean(draft && !draft.error);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, draft?.content, draft?.tools.length]);

  useEffect(() => input.current?.focus(), [agent.id]);

  const submit = () => {
    const v = text.trim();
    if (!v || busy) return;
    onSend(v);
    setText("");
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-6 py-3.5">
        <Avatar agent={agent} size={40} />
        <div className="min-w-0">
          <div className="font-semibold">{agent.name}</div>
          <div className="flex items-center gap-3">
            <StatusText status={agent.status} />
            <span className="truncate text-xs text-muted">{agent.role}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-muted">{agent.effectiveModel}</span>
          <Button onClick={onClear} title={t("clearChat")}>
            <Trash2 size={16} />
          </Button>
        </div>
      </header>

      {status && !status.online && (
        <div className="mx-6 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <b>{t("offline")}.</b> {t("offlineHint")}
        </div>
      )}
      {status?.online && status.provider === "ollama" && !status.modelInstalled && !agent.model && (
        <div className="mx-6 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-sm text-amber-200">
          {t("modelMissing", { model: status.model })}
        </div>
      )}

      <div ref={scroller} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
          {messages.length === 0 && !draft && (
            <div className="grid place-items-center py-24 text-center">
              <Avatar agent={agent} size={72} />
              <div className="mt-4 text-xl font-semibold">{agent.name}</div>
              <div className="mt-1 max-w-sm text-sm text-muted">{t("emptyChat", { name: agent.name })}</div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} agent={agent} role={m.role} content={m.content} tools={m.meta?.tools} />
          ))}
          {draft && (
            <Bubble agent={agent} role="assistant" content={draft.content} tools={draft.tools} streaming={!draft.error} error={draft.error} />
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-line bg-panel-2/80 p-2 pl-4 shadow-xl shadow-black/30 focus-within:border-violet-500/50">
          <textarea
            ref={input}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("messagePlaceholder", { name: agent.name })}
            className="max-h-[200px] flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted/60"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || busy}
            aria-label={t("send")}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white transition hover:brightness-110 disabled:opacity-30"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
