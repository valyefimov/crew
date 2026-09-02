export function toBlob(vec: number[]): Uint8Array {
  return new Uint8Array(new Float32Array(vec).buffer);
}

export function fromBlob(blob: Uint8Array): Float32Array {
  const copy = blob.slice();
  return new Float32Array(copy.buffer, copy.byteOffset, copy.byteLength / 4);
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const STOP = new Set(
  (
    "the and for are was were you your what which who how why when where this that with from have has had " +
    "use used does did not but can could would should about into our out his her its they them their there " +
    "что как это где когда кто для или если так уже все она они оно его мне меня мой моя мои наш ваш тебе тебя " +
    "що як это коли хто або якщо вже всі вона вони його мені мене мій моя мої наш ваш тобі тебе"
  ).split(" "),
);

/**
 * Turn free text into a safe FTS5 query: meaningful words OR-ed together.
 * Longer words are prefix-matched, which roughly handles inflection (база → базы, базу).
 */
export function ftsQuery(text: string): string | null {
  const words = text
    .toLowerCase()
    .match(/[\p{L}\p{N}_]{3,}/gu)
    ?.filter((w) => !STOP.has(w))
    .slice(0, 24);
  if (!words?.length) return null;
  return [...new Set(words)].map((w) => (w.length >= 5 ? `"${w.slice(0, Math.max(5, w.length - 2))}"*` : `"${w}"`)).join(" OR ");
}
