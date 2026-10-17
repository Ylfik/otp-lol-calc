/* The site stores an item by its name; the client wants its number.
 *
 * Rather than copying a table that would rot with every patch, the names
 * are matched against Riot's own item list, fetched once and kept.
 */

import https from "node:https";
import http from "node:http";

const DD = process.env.OVERLAY_DDRAGON || "https://ddragon.leagueoflegends.com";
let cache: Map<string, number> | null = null;
let version: string | null = null;

function getJson(url: string, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "http:" ? http : https;
    const req = mod.get(
      { hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, timeout: timeoutMs },
      res => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", c => { body += c; });
        res.on("end", () => {
          if ((res.statusCode || 0) >= 400) { reject(new Error("ddragon " + res.statusCode)); return; }
          try { resolve(JSON.parse(body)); } catch { reject(new Error("réponse illisible")); }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("ddragon injoignable")));
    req.on("error", reject);
  });
}

/** Normalised for comparison: the site shouts its item names. */
export const normalise = (s: string): string =>
  String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function itemIds(): Promise<Map<string, number>> {
  if (cache) return cache;
  if (!version) {
    const vs = await getJson(DD + "/api/versions.json");
    version = Array.isArray(vs) && vs.length ? String(vs[0]) : null;
    if (!version) throw new Error("version de Data Dragon introuvable");
  }
  const data = await getJson(`${DD}/cdn/${version}/data/en_US/item.json`);
  const map = new Map<string, number>();
  for (const [id, it] of Object.entries<any>(data?.data || {})) {
    const n = normalise(it?.name);
    /* the first id wins: Riot lists a few duplicates for other maps, and
       the lower number is the Summoner's Rift one */
    if (n && !map.has(n)) map.set(n, Number(id));
  }
  cache = map;
  return map;
}

/** Ids for the names a build carries; names that cannot be matched are
 *  reported rather than silently dropped. */
export async function resolveItems(names: string[]): Promise<{ ids: number[]; missing: string[] }> {
  const map = await itemIds();
  const ids: number[] = [];
  const missing: string[] = [];
  for (const n of names) {
    const id = map.get(normalise(n));
    if (id) ids.push(id); else missing.push(n);
  }
  return { ids, missing };
}
