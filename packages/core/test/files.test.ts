import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAllowed } from "../src/index.ts";

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "crew-"));
  const shared = join(root, "shared");
  const secret = join(root, "secret");
  mkdirSync(shared);
  mkdirSync(secret);
  writeFileSync(join(shared, "notes.md"), "hi");
  writeFileSync(join(secret, "key.txt"), "nope");
  symlinkSync(secret, join(shared, "link"));
  return { root, shared, secret };
}

const folder = (path: string, mode: "ro" | "rw" = "ro") => ({ id: "f", agentId: "a", path, mode });

describe("resolveAllowed", () => {
  it("resolves relative paths inside a shared folder", async () => {
    const { shared } = sandbox();
    const r = await resolveAllowed([folder(shared)], "notes.md", "ro");
    expect(r.path.endsWith("notes.md")).toBe(true);
  });

  it("blocks ../ escapes", async () => {
    const { shared } = sandbox();
    await expect(resolveAllowed([folder(shared)], "../secret/key.txt", "ro")).rejects.toThrow(/denied/);
  });

  it("blocks symlink escapes", async () => {
    const { shared } = sandbox();
    await expect(resolveAllowed([folder(shared)], "link/key.txt", "ro")).rejects.toThrow(/denied/);
  });

  it("requires rw for writes, and allows new files", async () => {
    const { shared } = sandbox();
    await expect(resolveAllowed([folder(shared)], "new.md", "rw")).rejects.toThrow(/read-only/);
    const r = await resolveAllowed([folder(shared, "rw")], "drafts/new.md", "rw");
    expect(r.path.endsWith(join("drafts", "new.md"))).toBe(true);
  });
});
