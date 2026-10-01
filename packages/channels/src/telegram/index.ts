import { randomInt } from "node:crypto";
import { Bot, type Context } from "grammy";
import type { Crew } from "@crew/core";

export interface TelegramOptions {
  token: string;
  log?: (msg: string) => void;
}

const PAIRED = "telegram.paired";
const ACTIVE = "telegram.active";

/**
 * One bot for the whole workspace. Only paired chats may talk to it:
 * on start Crew prints a one-time code, and you send `/pair CODE` to the bot.
 */
export class TelegramChannel {
  readonly bot: Bot;
  readonly pairingCode = String(randomInt(100000, 999999));
  private log: (msg: string) => void;

  constructor(
    private readonly crew: Crew,
    opts: TelegramOptions,
  ) {
    this.log = opts.log ?? ((m) => console.log(m));
    this.bot = new Bot(opts.token);
    this.setup();
  }

  private paired(): number[] {
    return this.crew.store.getSetting<number[]>(PAIRED) ?? [];
  }

  private activeAgent(chatId: number): string | null {
    const map = this.crew.store.getSetting<Record<string, string>>(ACTIVE) ?? {};
    const id = map[chatId];
    if (id && this.crew.store.getAgent(id)) return id;
    return this.crew.store.listAgents()[0]?.id ?? null;
  }

  private setActive(chatId: number, agentId: string) {
    const map = this.crew.store.getSetting<Record<string, string>>(ACTIVE) ?? {};
    map[chatId] = agentId;
    this.crew.store.setSetting(ACTIVE, map);
  }

  private setup() {
    const bot = this.bot;

    bot.command("start", (ctx) =>
      ctx.reply(
        this.paired().includes(ctx.chat.id)
          ? "👋 Crew is here. /agents — list colleagues, /use <name> — switch, /memory — what I remember."
          : "👋 This is a private Crew workspace. Send /pair <code> with the code shown in your terminal.",
      ),
    );

    bot.command("pair", async (ctx) => {
      if (ctx.match.trim() !== this.pairingCode) return ctx.reply("❌ Wrong code.");
      this.crew.store.setSetting(PAIRED, [...new Set([...this.paired(), ctx.chat.id])]);
      this.log(`telegram: paired chat ${ctx.chat.id}`);
      return ctx.reply("✅ Paired! Say hi to your crew. /agents to see who's here.");
    });

    // Everything below requires a paired chat.
    bot.use(async (ctx, next) => {
      if (ctx.chat && this.paired().includes(ctx.chat.id)) return next();
      if (ctx.chat) await ctx.reply("🔒 Not paired. Send /pair <code>.");
    });

    bot.command("agents", (ctx) => {
      const active = this.activeAgent(ctx.chat.id);
      const list = this.crew.store.listAgents();
      if (!list.length) return ctx.reply("No agents yet — create one in the web UI or with `crew agent create`.");
      return ctx.reply(
        list.map((a) => `${a.id === active ? "▶️" : "  "} ${a.avatar} *${a.name}* — ${a.role || "colleague"}`).join("\n"),
        { parse_mode: "Markdown" },
      );
    });

    bot.command("use", (ctx) => {
      const agent = this.crew.store.getAgent(ctx.match.trim());
      if (!agent) return ctx.reply("Unknown agent. /agents to list.");
      this.setActive(ctx.chat.id, agent.id);
      return ctx.reply(`${agent.avatar} Now talking to ${agent.name}.`);
    });

    bot.command("memory", (ctx) => {
      const id = this.activeAgent(ctx.chat.id);
      if (!id) return ctx.reply("No agents yet.");
      const mems = this.crew.store.listMemories(id, 15);
      return ctx.reply(mems.length ? mems.map((m) => `• ${m.content}`).join("\n") : "Nothing remembered yet.");
    });

    bot.command("forget", (ctx) => {
      const id = this.activeAgent(ctx.chat.id);
      if (!id) return;
      this.crew.store.clearConversation(this.crew.store.conversation(id, "telegram", String(ctx.chat.id)).id);
      return ctx.reply("🧹 Chat history cleared (long-term memory kept).");
    });

    bot.on("message:text", (ctx) => this.onText(ctx, ctx.message.text));

    bot.catch((err) => this.log(`telegram: ${err.message}`));
  }

  private async onText(ctx: Context, text: string) {
    const chatId = ctx.chat!.id;
    const agentId = this.activeAgent(chatId);
    if (!agentId) return ctx.reply("No agents yet — create one first.");

    // Can name an agent inline: "@Lena how does this look?"
    let target = agentId;
    const mention = text.match(/^@?([\p{L}\d_-]+)[,:]\s+/u);
    const named = mention && this.crew.store.getAgent(mention[1]);
    if (named) {
      target = named.id;
      text = text.slice(mention[0].length);
    }

    const typing = setInterval(() => ctx.replyWithChatAction("typing").catch(() => {}), 4000);
    await ctx.replyWithChatAction("typing").catch(() => {});
    try {
      const reply = await this.crew.chat({ agent: target, text, channel: "telegram", channelRef: String(chatId) });
      const agent = this.crew.store.getAgent(target)!;
      const body = named ? `${agent.avatar} ${agent.name}:\n${reply.content}` : reply.content;
      for (const part of chunk(body, 4000)) {
        await ctx.reply(part, { parse_mode: "Markdown" }).catch(() => ctx.reply(part));
      }
    } catch (err) {
      await ctx.reply(`⚠️ ${(err as Error).message}`);
    } finally {
      clearInterval(typing);
    }
  }

  async start() {
    const me = await this.bot.api.getMe();
    this.log(`telegram: @${me.username} is online — pairing code ${this.pairingCode}`);
    void this.bot.start({ drop_pending_updates: true });
    return me;
  }

  async stop() {
    await this.bot.stop();
  }
}

function chunk(s: string, size: number) {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}
