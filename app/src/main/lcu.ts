/* Talking to the League client itself.
 *
 * Separate from the in-game API: this one runs whenever the client is
 * open, and it is what knows about champion select, rune pages and item
 * sets. It is also local-only — no Riot API key, nothing leaves the
 * machine — but it is authenticated: the client writes a port and a
 * one-time password into a `lockfile` next to its executable, and that
 * pair is the credential.
 *
 * The certificate is Riot's own and self-signed, so verification is
 * relaxed for the loopback address alone.
 */

import https from "node:https";
import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export interface Lockfile {
  port: number;
  password: string;
  protocol: "https" | "http";
}

/* Where the client usually puts it. The install can be moved, so the
   environment can say instead, and a running client can also be found
   from its command line — see findLockfile below. */
const DEFAULT_PATHS = [
  "C:\\Riot Games\\League of Legends\\lockfile",
  "C:\\Program Files\\Riot Games\\League of Legends\\lockfile",
  "C:\\Program Files (x86)\\Riot Games\\League of Legends\\lockfile",
  "/Applications/League of Legends.app/Contents/LoL/lockfile"
];

export function parseLockfile(text: string): Lockfile | null {
  /* name:pid:port:password:protocol */
  const bits = String(text || "").trim().split(":");
  if (bits.length < 5) return null;
  const port = Number(bits[2]);
  const password = bits[3];
  const protocol = bits[4] === "http" ? "http" : "https";
  if (!Number.isInteger(port) || port <= 0 || !password) return null;
  return { port, password, protocol };
}

export function findLockfile(): Lockfile | null {
  const extra = process.env.OVERLAY_LOCKFILE;
  const paths = extra ? [extra, ...DEFAULT_PATHS] : DEFAULT_PATHS;
  for (const p of paths) {
    try {
      if (!existsSync(p)) continue;
      const got = parseLockfile(readFileSync(p, "utf8"));
      if (got) return got;
    } catch { /* locked or unreadable: try the next */ }
  }
  return null;
}

/* relaxed only for the client's own loopback certificate */
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

export interface LcuReply { status: number; body: unknown; }

export function request(
  lock: Lockfile, method: string, pathname: string, payload?: unknown, timeoutMs = 6000
): Promise<LcuReply> {
  return new Promise((resolve, reject) => {
    const data = payload === undefined ? null : JSON.stringify(payload);
    const mod = lock.protocol === "http" ? http : https;
    const req = mod.request(
      {
        hostname: "127.0.0.1", port: lock.port, path: pathname, method,
        timeout: timeoutMs,
        ...(lock.protocol === "https" ? { agent } : {}),
        headers: {
          /* the client expects "riot" as the user name */
          authorization: "Basic " + Buffer.from("riot:" + lock.password).toString("base64"),
          accept: "application/json",
          ...(data ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {})
        }
      },
      res => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", c => { text += c; });
        res.on("end", () => {
          let body: unknown = null;
          try { body = text ? JSON.parse(text) : null; } catch { body = text; }
          resolve({ status: res.statusCode || 0, body });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("client League injoignable")));
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

/* ------------------------------------------------------------------ */

export interface ChampSelect {
  active: boolean;
  /** the champion this player has picked or is hovering, 0 when none */
  championId: number;
  /** true once the pick is locked in */
  locked: boolean;
}

/** Reads champion select, if it is happening. */
export async function champSelect(lock: Lockfile): Promise<ChampSelect> {
  const r = await request(lock, "GET", "/lol-champ-select/v1/session");
  if (r.status === 404) return { active: false, championId: 0, locked: false };
  const s = r.body as any;
  if (!s || !Array.isArray(s.myTeam)) return { active: false, championId: 0, locked: false };

  const cell = Number(s.localPlayerCellId);
  const me = s.myTeam.find((p: any) => Number(p.cellId) === cell);
  const picked = Number(me?.championId) || 0;
  /* while hovering, the pick shows in the action rather than on the team */
  let hovered = 0, locked = false;
  for (const group of s.actions || [])
    for (const a of group || [])
      if (Number(a.actorCellId) === cell && a.type === "pick") {
        hovered = Number(a.championId) || hovered;
        locked = !!a.completed;
      }
  return { active: true, championId: picked || hovered, locked };
}

export async function summonerId(lock: Lockfile): Promise<number | null> {
  const r = await request(lock, "GET", "/lol-summoner/v1/current-summoner");
  const id = Number((r.body as any)?.summonerId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Replaces the current rune page.
 *
 * The client allows a limited number of pages, so rather than piling new
 * ones up this deletes the page it made last time — recognised by its
 * name — before adding the new one. A page the player made by hand is
 * never touched.
 */
export async function applyRunePage(lock: Lockfile, page: unknown, mark: string): Promise<void> {
  const list = await request(lock, "GET", "/lol-perks/v1/pages");
  if (Array.isArray(list.body)) {
    for (const p of list.body as any[]) {
      if (typeof p?.name === "string" && p.name.startsWith(mark) && p.isDeletable !== false)
        await request(lock, "DELETE", "/lol-perks/v1/pages/" + p.id);
    }
  }
  const made = await request(lock, "POST", "/lol-perks/v1/pages", page);
  if (made.status >= 400)
    throw new Error("le client a refusé la page de runes (" + made.status + ")");
}

/** Sends the build's items as a set the shop can show. */
export async function applyItemSet(
  lock: Lockfile, sid: number, championId: number, title: string, itemIds: number[]
): Promise<void> {
  const current = await request(lock, "GET", `/lol-item-sets/v1/item-sets/${sid}/sets`);
  const body = (current.body as any) || {};
  const kept = Array.isArray(body.itemSets)
    ? body.itemSets.filter((s: any) => !String(s?.title || "").startsWith(title.split(" — ")[0]))
    : [];
  kept.unshift({
    title,
    type: "custom",
    map: "SR",
    mode: "any",
    sortrank: 1,
    associatedChampions: championId ? [championId] : [],
    associatedMaps: [11],
    blocks: [{
      type: title,
      items: itemIds.map(id => ({ id: String(id), count: 1 }))
    }]
  });
  const r = await request(lock, "PUT", `/lol-item-sets/v1/item-sets/${sid}/sets`,
    { accountId: body.accountId || 0, itemSets: kept, timestamp: Date.now() });
  if (r.status >= 400)
    throw new Error("le client a refusé le set d'objets (" + r.status + ")");
}
