/* Signing in with Discord, so the app can read the account's own library.
 *
 * This is optional by design: everything public works without it, and the
 * app never asks for it at startup. Someone handed this overlay to watch
 * Baron timers should not meet a login screen.
 *
 * The flow is Supabase's PKCE: the app opens the person's real browser,
 * Discord and Supabase do their part there, and the reply comes back to a
 * short-lived server on the loopback address. No password ever passes
 * through this app, and the browser is the person's own, with whatever
 * session they already have.
 */

import { shell, safeStorage, app } from "electron";
import { createServer, type Server } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import path from "node:path";
import https from "node:https";
import { SITE_URL, SITE_ANON_KEY } from "./siteClient.js";

/* A fixed port keeps the redirect URL stable, which matters because it
   has to be listed in Supabase's allowed redirect URLs. */
export const LOOPBACK_PORT = 53123;
export const REDIRECT_URL = `http://127.0.0.1:${LOOPBACK_PORT}/auth`;

export interface Session {
  accessToken: string;
  refreshToken: string;
  /* epoch seconds */
  expiresAt: number;
  name: string;
}

let current: Session | null = null;

/* ---------- where the refresh token sleeps ------------------------- */

const tokenFile = () => path.join(app.getPath("userData"), "session.bin");

/* Encrypted with the operating system's own key store when it offers one
   — DPAPI on Windows. Without it the token is NOT written at all: a
   refresh token in plain text on disk is a password in plain text, and
   signing in again is a smaller cost than that. */
function keepRefresh(token: string | null): void {
  try {
    if (!token) { unlinkSync(tokenFile()); return; }
    if (!safeStorage.isEncryptionAvailable()) return;
    mkdirSync(path.dirname(tokenFile()), { recursive: true });
    writeFileSync(tokenFile(), safeStorage.encryptString(token));
  } catch { /* losing the token only means signing in again */ }
}

function readRefresh(): string | null {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(readFileSync(tokenFile()));
  } catch { return null; }
}

/* ---------- talking to Supabase's auth endpoint -------------------- */

function postJson(pathname: string, body: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(SITE_URL + pathname);
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
        method: "POST", timeout: 15000,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
          apikey: SITE_ANON_KEY
        }
      },
      res => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", c => { text += c; });
        res.on("end", () => {
          let j: any = null;
          try { j = JSON.parse(text); } catch { /* handled below */ }
          if (!j || (res.statusCode && res.statusCode >= 400)) {
            reject(new Error((j && (j.error_description || j.msg || j.error)) || "connexion refusée"));
            return;
          }
          resolve(j);
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Supabase injoignable")));
    req.on("error", reject);
    req.end(payload);
  });
}

const b64url = (b: Buffer) =>
  b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function adopt(j: any): Session {
  const name =
    (j.user && j.user.user_metadata &&
      (j.user.user_metadata.full_name || j.user.user_metadata.name)) ||
    (j.user && j.user.email) || "compte";
  current = {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + (Number(j.expires_in) || 3600),
    name: String(name)
  };
  keepRefresh(current.refreshToken);
  return current;
}

/* ---------- the flow ------------------------------------------------ */

let pending: Server | null = null;

/** Opens the browser and resolves once the reply has come back. */
export function signIn(): Promise<Session> {
  return new Promise((resolve, reject) => {
    if (pending) { reject(new Error("une connexion est déjà en cours")); return; }

    const verifier = b64url(randomBytes(32));
    const challenge = b64url(createHash("sha256").update(verifier).digest());

    /* No `state` of our own is checked on the way back. Supabase mints its
       own signed state for the provider round trip and does not echo a
       caller's, so a check on it could never pass — which is exactly how
       this failed the first time it met a real Discord login.
       The protection is PKCE: the code is worthless without the verifier,
       which never leaves this process, and the server below accepts one
       callback then closes. */

    const done = (err: Error | null, s?: Session) => {
      if (pending) { pending.close(); pending = null; }
      clearTimeout(timer);
      err ? reject(err) : resolve(s as Session);
    };

    const timer = setTimeout(
      () => done(new Error("connexion abandonnée : pas de réponse")),
      5 * 60 * 1000
    );

    pending = createServer(async (req, res) => {
      const u = new URL(req.url || "/", REDIRECT_URL);
      if (u.pathname !== "/auth") { res.writeHead(404).end(); return; }

      const page = (msg: string) =>
        `<!doctype html><meta charset="utf-8"><title>LoL Overlay</title>` +
        `<body style="background:#0d1117;color:#e9eef6;font:15px system-ui;` +
        `display:flex;align-items:center;justify-content:center;height:100vh">` +
        `<p>${msg}</p>`;

      const code = u.searchParams.get("code");
      const oauthErr = u.searchParams.get("error_description") || u.searchParams.get("error");
      if (!code) {
        res.writeHead(400, { "content-type": "text/html; charset=utf-8" })
           .end(page("Connexion refusée. Vous pouvez fermer cet onglet."));
        done(new Error(oauthErr || "aucun code reçu"));
        return;
      }
      try {
        const j = await postJson("/auth/v1/token?grant_type=pkce", {
          auth_code: code, code_verifier: verifier
        });
        const s = adopt(j);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
           .end(page("Connecté. Vous pouvez fermer cet onglet et revenir à l'app."));
        done(null, s);
      } catch (e) {
        res.writeHead(500, { "content-type": "text/html; charset=utf-8" })
           .end(page("La connexion a échoué. Vous pouvez fermer cet onglet."));
        done(e instanceof Error ? e : new Error(String(e)));
      }
    });

    pending.on("error", e => done(e instanceof Error ? e : new Error(String(e))));
    pending.listen(LOOPBACK_PORT, "127.0.0.1", () => {
      const q = new URLSearchParams({
        provider: "discord",
        redirect_to: REDIRECT_URL,
        code_challenge: challenge,
        code_challenge_method: "s256"
      });
      shell.openExternal(`${SITE_URL}/auth/v1/authorize?${q}`);
    });
  });
}

/** A valid access token, refreshing when it is about to expire. */
export async function token(): Promise<string | null> {
  if (current && current.expiresAt - 60 > Math.floor(Date.now() / 1000))
    return current.accessToken;

  const refresh = (current && current.refreshToken) || readRefresh();
  if (!refresh) return null;
  try {
    const j = await postJson("/auth/v1/token?grant_type=refresh_token", { refresh_token: refresh });
    return adopt(j).accessToken;
  } catch {
    /* an expired or revoked token is not an error worth shouting about:
       the app simply goes back to its signed-out, public-only self */
    current = null;
    keepRefresh(null);
    return null;
  }
}

export function signOut(): void {
  current = null;
  keepRefresh(null);
}

export const who = (): string | null => (current ? current.name : null);

/** True when a session could be restored without the person doing anything. */
export const canResume = (): boolean => !!current || !!readRefresh();

/** Whether this machine can store the token at all. */
export const canRemember = (): boolean => {
  try { return safeStorage.isEncryptionAvailable(); } catch { return false; }
};
