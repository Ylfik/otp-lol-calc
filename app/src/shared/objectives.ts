/* When each objective comes back, and when to say so.
 *
 * Every timing here was read off the League wiki rather than remembered,
 * and each one carries the line it came from. They change with patches, so
 * this table is the single place to edit when they do.
 *
 * Nothing in this file touches Electron or the network: it is a pure
 * function of the game clock and the events the game has already reported,
 * which is what makes it testable without League running.
 */

export type ObjectiveId = "dragon" | "grubs" | "herald" | "baron" | "elder";

export interface ObjectiveSpec {
  id: ObjectiveId;
  /** shown on the alert */
  label: { en: string; fr: string };
  /** seconds of game time at which it first appears, null when conditional */
  firstSpawn: number | null;
  /** seconds between a kill and the next spawn, null when it never returns */
  respawn: number | null;
  /** game time after which it is gone for good, null when it never leaves */
  despawn: number | null;
  /** event names the game uses for a kill — several, because they vary */
  killEvents: string[];
  source: string;
}

/* Patch 26.20. Each figure cites the wiki page it was taken from. */
export const OBJECTIVES: ObjectiveSpec[] = [
  {
    id: "dragon",
    label: { en: "Dragon", fr: "Drake" },
    firstSpawn: 5 * 60,
    respawn: 5 * 60,
    despawn: null,
    killEvents: ["DragonKill"],
    source: "Dragon pit: first drake at 5:00, next 5 minutes after a kill"
  },
  {
    id: "grubs",
    label: { en: "Voidgrubs", fr: "Larves du Néant" },
    firstSpawn: 8 * 60,
    respawn: null,
    despawn: 14 * 60 + 45,
    killEvents: ["HordeKill", "VoidgrubKill"],
    source: "Voidgrub camp: spawns 8:00, once per game, gone at 14:45"
  },
  {
    id: "herald",
    label: { en: "Rift Herald", fr: "Héraut de la Faille" },
    firstSpawn: 15 * 60,
    respawn: null,
    despawn: 19 * 60 + 45,
    killEvents: ["HeraldKill", "RiftHeraldKill"],
    source: "Rift Herald: spawns 15:00, once per game, gone at 19:45"
  },
  {
    id: "baron",
    label: { en: "Baron Nashor", fr: "Baron Nashor" },
    firstSpawn: 20 * 60,
    respawn: 6 * 60,
    despawn: null,
    killEvents: ["BaronKill"],
    source: "Baron Nashor: spawns 20:00, respawns 6:00 after a kill"
  },
  {
    id: "elder",
    label: { en: "Elder Dragon", fr: "Dragon Ancestral" },
    /* conditional: it replaces the drake once a team has taken four */
    firstSpawn: null,
    respawn: 6 * 60,
    despawn: null,
    killEvents: ["DragonKill"],
    source: "Elder Dragon: replaces the drake once a team has killed four, respawns 6:00"
  }
];

/* Atakhan is deliberately absent: the wiki marks his page as removed, so he
   is no longer in the game and an alert for him would be noise. */

/** One event as the game's own local API reports it. */
export interface GameEvent {
  EventID?: number;
  EventName: string;
  EventTime: number;
  KillerName?: string;
  DragonType?: string;
  [k: string]: unknown;
}

export type Side = "ORDER" | "CHAOS";

export interface ObjectiveState {
  id: ObjectiveId;
  label: { en: string; fr: string };
  /** "up" = available now, "soon" = a spawn time is known, "gone" = finished */
  status: "up" | "soon" | "gone";
  /** game time of the next spawn, when one is known */
  spawnAt: number | null;
  /** seconds until that spawn, negative once it is up */
  inSeconds: number | null;
}

const isElder = (e: GameEvent) =>
  String(e.DragonType || "").toLowerCase() === "elder";

/**
 * Works out where every objective stands.
 *
 * `teamOf` maps a killer's name to their side so that the fourth drake can
 * be attributed; without it the Elder is simply reported as unknown rather
 * than guessed at.
 */
export function objectiveStates(
  gameTime: number,
  events: GameEvent[],
  teamOf?: (killerName: string) => Side | undefined
): ObjectiveState[] {
  const byName = new Map<string, GameEvent[]>();
  for (const e of events) {
    const list = byName.get(e.EventName) || [];
    list.push(e);
    byName.set(e.EventName, list);
  }
  const kills = (spec: ObjectiveSpec) =>
    spec.killEvents
      .flatMap(n => byName.get(n) || [])
      .sort((a, b) => a.EventTime - b.EventTime);

  /* drakes per side, so we know when the Elder takes over */
  const drakeKills = (byName.get("DragonKill") || []).filter(e => !isElder(e));
  const perSide: Record<Side, number> = { ORDER: 0, CHAOS: 0 };
  let sideKnown = true;
  for (const e of drakeKills) {
    const side = teamOf && e.KillerName ? teamOf(e.KillerName) : undefined;
    if (!side) { sideKnown = false; continue; }
    perSide[side]++;
  }
  const elderTakesOver = sideKnown
    ? perSide.ORDER >= 4 || perSide.CHAOS >= 4
    : drakeKills.length >= 4;   /* a floor: four drakes is the earliest possible */

  const out: ObjectiveState[] = [];

  for (const spec of OBJECTIVES) {
    const mine = kills(spec).filter(e =>
      spec.id === "elder" ? isElder(e) : spec.id === "dragon" ? !isElder(e) : true
    );
    const last = mine.length ? mine[mine.length - 1] : null;

    let spawnAt: number | null = null;
    let status: ObjectiveState["status"] = "soon";

    if (spec.id === "elder") {
      if (!elderTakesOver) { out.push(blank(spec, "gone")); continue; }
      spawnAt = last ? last.EventTime + (spec.respawn as number) : null;
      /* the moment a team takes its fourth drake the Elder is on the drake
         timer, which we only know from the last drake killed */
      if (!last) {
        const lastDrake = drakeKills.length ? drakeKills[drakeKills.length - 1] : null;
        spawnAt = lastDrake ? lastDrake.EventTime + 6 * 60 : null;
      }
    } else if (spec.id === "dragon" && elderTakesOver) {
      out.push(blank(spec, "gone"));
      continue;
    } else if (last && spec.respawn !== null) {
      spawnAt = last.EventTime + spec.respawn;
    } else if (last && spec.respawn === null) {
      out.push(blank(spec, "gone"));
      continue;
    } else {
      spawnAt = spec.firstSpawn;
    }

    /* a camp that leaves the map at a fixed time stops mattering */
    if (spec.despawn !== null && gameTime >= spec.despawn) {
      out.push(blank(spec, "gone"));
      continue;
    }
    if (spawnAt !== null && spec.despawn !== null && spawnAt >= spec.despawn) {
      out.push(blank(spec, "gone"));
      continue;
    }

    if (spawnAt !== null && gameTime >= spawnAt) status = "up";

    out.push({
      id: spec.id,
      label: spec.label,
      status,
      spawnAt,
      inSeconds: spawnAt === null ? null : Math.round(spawnAt - gameTime)
    });
  }
  return out;
}

const blank = (spec: ObjectiveSpec, status: ObjectiveState["status"]): ObjectiveState => ({
  id: spec.id, label: spec.label, status, spawnAt: null, inSeconds: null
});

/* ------------------------------------------------------------------ */

export interface Alert {
  id: ObjectiveId;
  label: { en: string; fr: string };
  inSeconds: number;
  spawnAt: number;
}

/**
 * Decides which alerts to raise this tick.
 *
 * `already` is the set of spawn times already announced, so a thirty second
 * warning is given once rather than on every poll. It is mutated.
 */
export function dueAlerts(
  states: ObjectiveState[],
  /* one warning for everything, or a different one per objective — the
     Baron is worth more notice than a camp that lasts a few minutes */
  leadSeconds: number | ((id: ObjectiveId) => number),
  already: Set<string>
): Alert[] {
  const leadOf = typeof leadSeconds === "function" ? leadSeconds : () => leadSeconds;
  const out: Alert[] = [];
  for (const s of states) {
    if (s.status !== "soon" || s.spawnAt === null || s.inSeconds === null) continue;
    const lead = leadOf(s.id);
    /* zero means the user turned this objective off */
    if (lead <= 0 || s.inSeconds > lead || s.inSeconds < 0) continue;
    const key = `${s.id}@${Math.round(s.spawnAt)}`;
    if (already.has(key)) continue;
    already.add(key);
    out.push({ id: s.id, label: s.label, inSeconds: s.inSeconds, spawnAt: s.spawnAt });
  }
  return out;
}

export const mmss = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
