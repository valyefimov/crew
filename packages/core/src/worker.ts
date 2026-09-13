import type { Store, Task } from "@crew/memory";

type Handler = (payload: Record<string, unknown>, task: Task) => Promise<void>;

/** Polls the SQLite task queue and runs handlers one at a time. */
export class Worker {
  private handlers = new Map<string, Handler>();
  private timer: NodeJS.Timeout | null = null;
  private running: Promise<void> | null = null;

  constructor(
    private readonly store: Store,
    private readonly intervalMs = 750,
  ) {}

  handle(kind: string, fn: Handler) {
    this.handlers.set(kind, fn);
  }

  start() {
    if (this.timer) return;
    this.store.recoverTasks();
    this.store.pruneTasks();
    this.timer = setInterval(() => {
      if (!this.running) this.running = this.drain().finally(() => (this.running = null));
    }, this.intervalMs);
    this.timer.unref?.();
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.running;
  }

  /** Run every due task. Exposed for tests and the CLI. */
  async drain() {
    for (let task = this.store.claimTask(); task; task = this.store.claimTask()) {
      const fn = this.handlers.get(task.kind);
      if (!fn) {
        this.store.finishTask(task.id, `No handler for ${task.kind}`);
        continue;
      }
      try {
        await fn(task.payload, task);
        this.store.finishTask(task.id);
      } catch (err) {
        const msg = (err as Error).message;
        this.store.finishTask(task.id, msg, task.attempts < 3 ? 2 ** task.attempts * 5_000 : undefined);
      }
    }
  }
}
