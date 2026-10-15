/* Builds published on otp-lol-calc, and what to do with one in a game.
 *
 * The site stores a build's levelling order as a list of eighteen letters,
 * one per level up. Knowing the player's level, the useful question is not
 * "what does this build end on" but "what do I put a point in right now" —
 * which is the one thing a player actually needs mid-game.
 *
 * No Electron, no network: a pure reading of a build and a level.
 */

export type SkillKey = "q" | "w" | "e" | "r";

export interface PublishedBuild {
  id: string;
  champion: string;
  author: string;
  name: string;
  patch: string;
  likes: number;
  role?: string | null;
  rank?: string | null;
  notes?: string | null;
  /** true for a build from the signed-in account's own library */
  mine?: boolean;
  data: {
    level?: number;
    q?: number; w?: number; e?: number; r?: number;
    order?: SkillKey[];
    items?: { name?: string | null }[];
    runes?: { id?: number | null }[];
    [k: string]: unknown;
  };
}

/* The game says "Cho'Gath"; the site files it under "chogath". Same rule
   for "Tahm Kench", "Xin Zhao", "Aurelion Sol" and the rest. */
export const championKey = (name: string): string =>
  String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** The ability to put the next point into, or null when nothing is known. */
export function nextSkill(order: SkillKey[] | undefined, level: number): SkillKey | null {
  if (!Array.isArray(order) || !order.length) return null;
  /* level 1 spends the first point, so a player at level n has used n of
     them and the next one is at index n */
  const i = Math.max(0, Math.floor(level));
  return i < order.length ? order[i] : null;
}

/** What the build says this level should look like, for a quick comparison. */
export function ranksAt(order: SkillKey[] | undefined, level: number): Record<SkillKey, number> {
  const out: Record<SkillKey, number> = { q: 0, w: 0, e: 0, r: 0 };
  if (!Array.isArray(order)) return out;
  const n = Math.min(order.length, Math.max(0, Math.floor(level)));
  for (let i = 0; i < n; i++) if (out[order[i]] !== undefined) out[order[i]]++;
  return out;
}

/** "Q>W>E" — how players describe a levelling path. */
export function orderSummary(order: SkillKey[] | undefined): string {
  if (!Array.isArray(order)) return "";
  const seen: SkillKey[] = [];
  for (const k of order) if (k !== "r" && seen.indexOf(k) < 0) seen.push(k);
  return seen.slice(0, 3).map(k => k.toUpperCase()).join(">");
}

/** Items in the order the build lists them, blanks dropped. */
export const itemNames = (b: PublishedBuild): string[] =>
  (b.data?.items || []).map(i => (i && i.name) || "").filter(Boolean);

/**
 * Picks the build to follow.
 *
 * `preferred` is an id the user chose; when it is missing or no longer
 * published, the most liked build for that champion is used instead, so
 * the overlay always has something to show rather than going blank.
 */
export function pickBuild(
  builds: PublishedBuild[],
  champion: string,
  preferred?: string | null
): PublishedBuild | null {
  const key = championKey(champion);
  const mine = builds.filter(b => championKey(b.champion) === key);
  if (!mine.length) return null;
  if (preferred) {
    const want = mine.find(b => b.id === preferred);
    if (want) return want;
  }
  /* the account's own builds come first: someone signed in wants their
     own build, not the most liked one of a stranger */
  return mine.slice().sort((a, b) =>
    Number(!!b.mine) - Number(!!a.mine) ||
    (b.likes || 0) - (a.likes || 0) ||
    String(b.id).localeCompare(String(a.id))
  )[0];
}

/** Only builds that carry a levelling order can answer "what next". */
export const hasOrder = (b: PublishedBuild | null): boolean =>
  !!b && Array.isArray(b.data?.order) && b.data.order.length > 0;
