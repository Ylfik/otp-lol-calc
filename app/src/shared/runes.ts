/* Turning a build from the site into a rune page the League client accepts.
 *
 * The site stores runes as a list of six perk ids plus three shard slots.
 * The client wants something stricter: two style ids and exactly nine
 * perks, in order — four from the primary tree, two from the secondary,
 * then the three shards. Getting that order or those ids wrong produces a
 * page the client silently refuses, or worse, accepts wrongly, so the
 * conversion lives here on its own and is tested.
 *
 * Every id below was read from Riot's own data rather than remembered:
 * the tree ids from Data Dragon's runesReforged, the shard ids from the
 * game-data perks list.
 */

export const STYLE_IDS: Record<string, number> = {
  Precision: 8000,
  Domination: 8100,
  Sorcery: 8200,
  Inspiration: 8300,
  Resolve: 8400
};

/* The site records a shard by the key of the option chosen in its row. */
export const SHARD_IDS: Record<string, number> = {
  adaptive: 5008,   /* Adaptive Force */
  as: 5005,         /* Attack Speed */
  ah: 5007,         /* Ability Haste */
  ms: 5010,         /* Move Speed */
  hpScale: 5001,    /* Health Scaling */
  hp65: 5011,       /* Health */
  ten: 5013         /* Tenacity and Slow Resist */
};

/* the choices offered in each shard row, in the site's own order */
export const SHARD_ROWS: string[][] = [
  ["adaptive", "as", "ah"],
  ["adaptive", "ms", "hpScale"],
  ["hp65", "ten", "hpScale"]
];

export interface RunePage {
  name: string;
  primaryStyleId: number;
  subStyleId: number;
  selectedPerkIds: number[];
  current: boolean;
}

export interface RuneRef { id?: number | null }

/** What a conversion refused to do, so the caller can say why. */
export class RuneError extends Error {}

/**
 * Builds the page.
 *
 * `treeOf` says which tree a perk belongs to; it comes from Riot's data
 * rather than from guessing, and deciding the styles from the perks
 * themselves means a build whose runes were stored in an unexpected order
 * still converts correctly.
 */
export function toRunePage(
  name: string,
  runes: (RuneRef | null | undefined)[] | undefined,
  shards: (number | null | undefined)[] | undefined,
  treeOf: (perkId: number) => string | undefined
): RunePage {
  const ids = (runes || [])
    .map(r => (r && typeof r.id === "number" ? r.id : null))
    .filter((x): x is number => x !== null);

  if (ids.length < 6)
    throw new RuneError("ce build n'a pas ses six runes");

  const trees = ids.map(id => {
    const t = treeOf(id);
    if (!t || !STYLE_IDS[t]) throw new RuneError("rune inconnue : " + id);
    return t;
  });

  const primary = trees[0];
  const secondary = trees.find(t => t !== primary);
  if (!secondary) throw new RuneError("les runes sont toutes du même arbre");

  const inPrimary = ids.filter((_, i) => trees[i] === primary);
  const inSecondary = ids.filter((_, i) => trees[i] === secondary);

  if (inPrimary.length !== 4)
    throw new RuneError(`${inPrimary.length} runes dans l'arbre principal au lieu de 4`);
  if (inSecondary.length !== 2)
    throw new RuneError(`${inSecondary.length} runes dans l'arbre secondaire au lieu de 2`);

  /* the three shards, each named by the row it sits in */
  const chosen = shards || [];
  const shardIds: number[] = [];
  for (let row = 0; row < 3; row++) {
    const pick = chosen[row];
    if (pick === null || pick === undefined)
      throw new RuneError("il manque un fragment");
    const key = SHARD_ROWS[row][pick as number];
    const id = key ? SHARD_IDS[key] : undefined;
    if (!id) throw new RuneError("fragment inconnu en ligne " + (row + 1));
    shardIds.push(id);
  }

  return {
    name: name.slice(0, 50),      /* the client rejects a long name */
    primaryStyleId: STYLE_IDS[primary],
    subStyleId: STYLE_IDS[secondary],
    selectedPerkIds: [...inPrimary, ...inSecondary, ...shardIds],
    current: true
  };
}

/** Builds the tree lookup from Data Dragon's runesReforged. */
export function treeLookup(reforged: unknown): (perkId: number) => string | undefined {
  const map = new Map<number, string>();
  if (Array.isArray(reforged)) {
    for (const tree of reforged as any[]) {
      const key = String(tree?.key || "");
      if (!STYLE_IDS[key]) continue;
      for (const slot of tree.slots || [])
        for (const r of slot.runes || [])
          if (typeof r?.id === "number") map.set(r.id, key);
    }
  }
  return (id: number) => map.get(id);
}

/** A page is only worth sending if it has nine perks and two real styles. */
export function pageLooksValid(p: RunePage): boolean {
  return !!p
    && Number.isInteger(p.primaryStyleId) && Number.isInteger(p.subStyleId)
    && p.primaryStyleId !== p.subStyleId
    && Array.isArray(p.selectedPerkIds)
    && p.selectedPerkIds.length === 9
    && p.selectedPerkIds.every(x => Number.isInteger(x) && x > 0);
}
