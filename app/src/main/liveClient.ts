/* Reads the game's own local API.
 *
 * While a game is running, League serves match data on 127.0.0.1:2999 over
 * HTTPS with a self-signed certificate. No Riot API key, no quota, no rate
 * limit — and nothing leaves the machine. Certificate checking is relaxed
 * for that one address only, because the certificate is Riot's own and is
 * not signed by anything a machine would trust.
 */

import https from "node:https";
import http from "node:http";
import type { GameEvent, Side } from "../shared/objectives.js";

export const LIVE_HOST = "127.0.0.1";
export const LIVE_PORT = 2999;

/* the relaxed check is confined to this agent, used only for the loopback
   address above — nothing else in the app reuses it */
const localAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

/* The real game speaks HTTPS. The bundled fake game speaks plain HTTP,
   because a self-signed certificate would add nothing to a test tool, so
   the scheme is selectable rather than assumed. */
export type Scheme = "http" | "https";

export interface LivePlayer {
  summonerName?: string;
  riotId?: string;
  riotIdGameName?: string;
  championName?: string;
  team?: string;
  level?: number;
  scores?: { creepScore?: number; kills?: number; deaths?: number; assists?: number };
}

export interface LiveSnapshot {
  gameTime: number;
  events: GameEvent[];
  players: LivePlayer[];
  activePlayer?: { riotId?: string; summonerName?: string; level?: number };
}

function getJson(path: string, port: number, timeoutMs: number, scheme: Scheme): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const mod = scheme === "http" ? http : https;
    const opts: Record<string, unknown> = { host: LIVE_HOST, port, path, timeout: timeoutMs };
    if (scheme === "https") opts.agent = localAgent;
    const req = mod.get(
      opts as never,
      res => {
        if (res.statusCode && res.statusCode >= 400) {
          res.resume();
          reject(new Error("HTTP " + res.statusCode));
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", c => { body += c; });
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error("réponse illisible")); }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("délai dépassé")));
    req.on("error", reject);
  });
}

/** One read of the whole match state. Rejects when no game is running. */
export async function readGame(
  port = LIVE_PORT, timeoutMs = 1500, scheme: Scheme = "https"
): Promise<LiveSnapshot> {
  const raw = (await getJson("/liveclientdata/allgamedata", port, timeoutMs, scheme)) as any;
  const events: GameEvent[] = Array.isArray(raw?.events?.Events) ? raw.events.Events : [];
  const players: LivePlayer[] = Array.isArray(raw?.allPlayers) ? raw.allPlayers : [];
  const gameTime = Number(raw?.gameData?.gameTime);
  if (!Number.isFinite(gameTime)) throw new Error("pas d'horloge de partie");
  return { gameTime, events, players, activePlayer: raw?.activePlayer };
}

/** Maps a killer's name to their side. Riot has changed the name field
 *  several times, so every spelling a player might arrive under is tried. */
export function teamLookup(players: LivePlayer[]): (name: string) => Side | undefined {
  const map = new Map<string, Side>();
  for (const p of players) {
    const side: Side | undefined =
      p.team === "ORDER" ? "ORDER" : p.team === "CHAOS" ? "CHAOS" : undefined;
    if (!side) continue;
    for (const n of [p.summonerName, p.riotId, p.riotIdGameName]) {
      if (!n) continue;
      map.set(n, side);
      /* "Name#EUW" and "Name" both appear depending on the field */
      const bare = String(n).split("#")[0];
      if (bare) map.set(bare, side);
    }
  }
  return (name: string) => map.get(name) ?? map.get(String(name).split("#")[0]);
}

/** The champion the person at the keyboard is playing, and their level. */
export function activeChampion(snap: LiveSnapshot): { champion: string; level: number } | null {
  const me = snap.activePlayer || {};
  const names = [me.riotId, me.summonerName]
    .filter(Boolean)
    .flatMap(n => [String(n), String(n).split("#")[0]]);
  for (const p of snap.players) {
    const his = [p.riotId, p.riotIdGameName, p.summonerName]
      .filter(Boolean)
      .flatMap(n => [String(n), String(n).split("#")[0]]);
    if (his.some(h => names.includes(h)) && p.championName)
      /* the level is on the active player; the roster entry carries one
         too, so take whichever is present rather than assuming either */
      return {
        champion: p.championName,
        level: Number(me.level) || Number(p.level) || 1
      };
  }
  return null;
}

export type Status = "waiting" | "running" | "error";

/**
 * Polls the game and calls back on every successful read.
 *
 * Between games the API simply refuses connections, which is normal rather
 * than an error, so the poller keeps trying quietly and reports "waiting".
 */
export function pollGame(
  onSnapshot: (s: LiveSnapshot) => void,
  onStatus: (s: Status, detail?: string) => void,
  opts: { everyMs?: number; port?: number; scheme?: Scheme } = {}
): () => void {
  const everyMs = opts.everyMs ?? 1000;
  const port = opts.port ?? LIVE_PORT;
  const scheme = opts.scheme ?? "https";
  let stopped = false;
  let last: Status | null = null;

  const say = (s: Status, d?: string) => { if (s !== last) { last = s; onStatus(s, d); } };

  const tick = async () => {
    if (stopped) return;
    try {
      const snap = await readGame(port, 1500, scheme);
      say("running");
      onSnapshot(snap);
    } catch (e) {
      /* no game yet, or the game just ended: not worth shouting about */
      say("waiting", e instanceof Error ? e.message : String(e));
    }
    if (!stopped) setTimeout(tick, everyMs);
  };
  tick();
  return () => { stopped = true; };
}
