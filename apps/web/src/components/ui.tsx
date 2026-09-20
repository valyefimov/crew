import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import type { Agent, AgentStatus } from "../api.ts";
import { useT } from "../i18n.ts";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Button({
  variant = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-40 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 hover:brightness-110",
        variant === "ghost" && "text-muted hover:bg-white/5 hover:text-text",
        variant === "outline" && "border border-line text-text hover:bg-white/5",
        variant === "danger" && "text-red-400 hover:bg-red-500/10",
        className,
      )}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20",
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full resize-none rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20",
        props.className,
      )}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">{children}</div>;
}

export function Avatar({ agent, size = 40 }: { agent: Pick<Agent, "avatar" | "color" | "status">; size?: number }) {
  const busy = agent.status && agent.status !== "idle";
  return (
    <div
      className={cx("relative grid shrink-0 place-items-center rounded-2xl", busy && "pulse")}
      style={
        {
          width: size,
          height: size,
          fontSize: size * 0.5,
          background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}15)`,
          border: `1px solid ${agent.color}55`,
          "--ring": agent.color,
        } as React.CSSProperties
      }
    >
      {agent.avatar}
    </div>
  );
}

const statusColor: Record<AgentStatus, string> = {
  idle: "bg-zinc-500",
  thinking: "bg-amber-400",
  working: "bg-cyan-400",
  remembering: "bg-violet-400",
};

export function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {status !== "idle" && <span className={cx("absolute inset-0 animate-ping rounded-full opacity-75", statusColor[status])} />}
      <span className={cx("relative inline-flex h-2 w-2 rounded-full", statusColor[status])} />
    </span>
  );
}

export function StatusText({ status }: { status: AgentStatus }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <StatusDot status={status} />
      {t(status)}
    </span>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className={cx(
          "max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-line bg-panel p-6 shadow-2xl",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 text-lg font-semibold">{title}</div>
        {children}
      </div>
    </div>
  );
}

export { cx };
