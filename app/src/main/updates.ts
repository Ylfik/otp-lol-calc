/* Tells the person when a newer version exists.
 *
 * It only looks and reports: nothing is downloaded, nothing is installed
 * behind their back. The app is not signed, so a silent self-replacing
 * update would be both harder to trust and harder to get right; a notice
 * and a link do the job and can never break an installation.
 *
 * One look per launch, and a failure is simply silence — a GitHub that is
 * slow or unreachable must not delay or disturb a game.
 */

import https from "node:https";
import http from "node:http";
import { latestRelease, isNewer, type ReleaseInfo } from "../shared/version.js";

/* The app lives in the website's repository, so releases are told apart
   by their tag prefix. */
export const REPO = process.env.OVERLAY_REPO || "Ylfik/otp-lol-calc";
export const TAG_PREFIX = "overlay-v";
const API = process.env.OVERLAY_GITHUB || "https://api.github.com";

function getJson(url: string, timeoutMs = 8000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    /* a static import, not require(): this file is an ES module, where
       require does not exist — and the catch below would have swallowed
       the error, leaving the check silently dead */
    const mod = u.protocol === "http:" ? http : https;
    const req = mod.get(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "http:" ? 80 : 443),
        path: u.pathname + u.search,
        timeout: timeoutMs,
        headers: { accept: "application/vnd.github+json", "user-agent": "lol-overlay" }
      },
      (res: any) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c: string) => { body += c; });
        res.on("end", () => {
          if (res.statusCode >= 400) { reject(new Error("GitHub " + res.statusCode)); return; }
          try { resolve(JSON.parse(body)); } catch { reject(new Error("réponse illisible")); }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("GitHub injoignable")));
    req.on("error", reject);
  });
}

export interface UpdateState {
  checked: boolean;
  installed: string;
  available: ReleaseInfo | null;   /* only ever set when genuinely newer */
}

let state: UpdateState = { checked: false, installed: "0.0.0", available: null };

export const updateState = (): UpdateState => state;

/** Looks once. Safe to call again; it simply refreshes what it found. */
export async function checkForUpdate(installed: string): Promise<UpdateState> {
  state = { checked: false, installed, available: null };
  try {
    const rows = await getJson(`${API}/repos/${REPO}/releases?per_page=30`);
    const best = latestRelease(rows, TAG_PREFIX);
    state = {
      checked: true,
      installed,
      available: best && isNewer(best.version, installed) ? best : null
    };
  } catch (e) {
    /* no network, rate limited, repository private: not worth a word to
       the player — but say it when debugging, so a check that stops
       working cannot stay invisible the way it just did */
    if (process.env.OVERLAY_DEBUG === "1")
      console.log("[maj] echec :", e instanceof Error ? e.message : e);
    state = { checked: true, installed, available: null };
  }
  return state;
}
