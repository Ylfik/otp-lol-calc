/* Reads the builds published on otp-lol-calc.
 *
 * The site's leaderboard view is public, so this needs no account and no
 * login: the key below is the project's anonymous key, the same one the
 * site itself ships in its page. It grants exactly what a visitor of the
 * site already has — reading published builds — and nothing more.
 *
 * A private library would need a signed-in session; that is a separate
 * step and deliberately not required to use the app.
 */

import https from "node:https";
import http from "node:http";
import type { PublishedBuild } from "../shared/builds.js";

/* Overridable so the bundled fake game can stand in for the site, which
   is how the whole path gets tested without a network. */
export const SITE_URL = process.env.OVERLAY_SITE || "https://ohgxdwrybdqkjcxvskjo.supabase.co";
export const SITE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZ3hkd3J5YmRxa2pjeHZza2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTY4MjUsImV4cCI6MjEwMTY3MjgyNX0.tIUzWum3uu4tu6KF4PjP0QlgyffU64yM5eqQV9bmvKw";

function getJson(url: string, token?: string, timeoutMs = 8000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "http:" ? http : https;
    const req = mod.get(
      {
        /* hostname, not host: host carries the port, which a DNS lookup
           then tries to resolve as part of the name */
        hostname: u.hostname,
        port: u.port || (u.protocol === "http:" ? 80 : 443),
        path: u.pathname + u.search, timeout: timeoutMs,
        headers: {
          apikey: SITE_ANON_KEY,
          Authorization: "Bearer " + (token || SITE_ANON_KEY),
          accept: "application/json"
        }
      },
      res => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", c => { body += c; });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error("site " + res.statusCode + " : " + body.slice(0, 160)));
            return;
          }
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("réponse du site illisible")); }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("site injoignable")));
    req.on("error", reject);
  });
}

/**
 * Published builds for one champion, most liked first.
 *
 * `token` is an access token from a signed-in session; without one the
 * read is anonymous, which is enough for everything public.
 */
export async function fetchBuilds(championKey: string, token?: string): Promise<PublishedBuild[]> {
  const q = new URLSearchParams({
    select: "id,champion,author,name,patch,likes,role,rank,notes,data",
    champion: "eq." + championKey,
    order: "likes.desc,created_at.desc",
    limit: "25"
  });
  const rows = await getJson(`${SITE_URL}/rest/v1/leaderboard?${q}`, token);
  return Array.isArray(rows) ? (rows as PublishedBuild[]) : [];
}

/* Builds are fetched once per champion and kept, so a game does not hit
   the site every second. A game lasts well under this. */
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; builds: PublishedBuild[] }>();

export async function buildsFor(championKey: string, token?: string): Promise<PublishedBuild[]> {
  if (!championKey) return [];
  const hit = cache.get(championKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.builds;
  const builds = await fetchBuilds(championKey, token);
  cache.set(championKey, { at: Date.now(), builds });
  return builds;
}

export const forgetBuilds = () => cache.clear();

/**
 * The account's own saved builds for one champion.
 *
 * These are private: the row-level rules on the table mean an anonymous
 * read returns nothing at all, so this is only called with a token.
 */
export async function fetchLibrary(championKey: string, token: string): Promise<PublishedBuild[]> {
  const q = new URLSearchParams({
    select: "id,champion,name,data,updated_at",
    champion: "eq." + championKey,
    order: "updated_at.desc",
    limit: "50"
  });
  const rows = await getJson(`${SITE_URL}/rest/v1/library?${q}`, token);
  if (!Array.isArray(rows)) return [];
  /* shaped like a published build so the rest of the app cannot tell
     the difference — only the label does */
  return rows.map((r: any) => ({
    id: "lib:" + r.id,
    champion: r.champion,
    author: "",
    name: r.name,
    patch: "",
    likes: 0,
    mine: true,
    data: r.data || {}
  })) as PublishedBuild[];
}
