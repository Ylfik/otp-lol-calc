/* The app replacing itself.
 *
 * electron-updater does the work; this file decides when it is allowed to
 * and turns its events into the one small object the windows draw. Three
 * rules shape it:
 *
 *   - the download happens on its own, the install never does. The app
 *     only swaps itself when the person presses the button, or when they
 *     quit of their own accord. Nothing restarts under someone mid-game.
 *   - a failure is quiet. GitHub being slow, rate limiting, a release
 *     published without its metadata — none of that is worth a word
 *     during a match, and none of it may break the rest of the app.
 *   - when it cannot update itself (a run from source, a release made by
 *     hand without `latest.yml`), it falls back to the plain look-and-say
 *     check in updates.ts, which only ever offers a link.
 *
 * A note on what is and is not guaranteed: the installer is unsigned, so
 * electron-updater skips its signature check (it has no publisher name to
 * compare against). What the download is checked against is the sha512 in
 * `latest.yml`, which comes from the same GitHub release over HTTPS. That
 * catches a corrupted download, not a compromised account.
 */

import { app } from "electron";
import pkg from "electron-updater";
import { idleUpdate, readableError, type AutoUpdate } from "../shared/updateState.js";
import { checkForUpdate, updateState as manualState } from "./updates.js";

/* electron-updater ships as CommonJS; the named export is not reachable
   from an ES module without going through the default object */
const { autoUpdater } = pkg;

let state: AutoUpdate = idleUpdate();
let onChange: (u: AutoUpdate) => void = () => {};
let started = false;

export const autoUpdate = (): AutoUpdate => state;
export function onAutoUpdate(fn: (u: AutoUpdate) => void): void { onChange = fn; }

function set(next: Partial<AutoUpdate>): void {
  state = { ...state, ...next };
  try { onChange(state); } catch { /* a window closing mid-event */ }
}

const log = (...a: unknown[]) => {
  if (process.env.OVERLAY_DEBUG === "1") console.log("[maj]", ...a);
};

/* The plain check, for builds that cannot replace themselves. It offers a
   version and a link and nothing else — which is what the app did before
   it could update itself, and still the right answer when it can't. */
async function fallBackToLink(why: string): Promise<void> {
  const st = await checkForUpdate(app.getVersion());
  if (st.available) {
    log("bascule sur le lien :", why);
    set({ stage: "manual", version: st.available.version, url: st.available.url, error: null });
  } else {
    /* nothing newer exists, so the failure did not cost anything */
    set({ stage: "none", version: null, url: null, error: null });
  }
}

export function start(): void {
  if (started) return;
  started = true;

  /* fetch by itself, install only when asked — except on a quit the
     person chose, which is the one moment a swap disturbs nobody */
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.logger = { info: log, warn: log, error: log, debug: () => {} } as never;

  /* running from source has no app-update.yml; the fallback handles it,
     but the test harness can ask for the real thing against a local feed */
  if (!app.isPackaged) {
    if (process.env.OVERLAY_UPDATE_DEV === "1") autoUpdater.forceDevUpdateConfig = true;
    else { void fallBackToLink("application non installée"); return; }
  }

  autoUpdater.on("checking-for-update", () => set({ stage: "checking", error: null }));

  autoUpdater.on("update-not-available", () =>
    set({ stage: "none", version: null, percent: 0, error: null }));

  autoUpdater.on("update-available", info =>
    set({ stage: "available", version: String(info?.version || ""), percent: 0, error: null }));

  autoUpdater.on("download-progress", p =>
    set({
      stage: "downloading",
      percent: Number(p?.percent) || 0,
      speed: Number(p?.bytesPerSecond) || 0
    }));

  autoUpdater.on("update-downloaded", info => {
    log("prête :", info?.version);
    set({ stage: "ready", version: String(info?.version || state.version || ""), percent: 100, speed: 0 });
  });

  autoUpdater.on("error", e => {
    const msg = e instanceof Error ? e.message : String(e);
    log("échec :", msg);
    /* a download that fell over mid-way is worth saying; a check that
       could not even start is better answered with a link */
    if (state.stage === "downloading" || state.stage === "ready")
      set({ stage: "error", error: readableError(msg), url: manualState().available?.url ?? null });
    else void fallBackToLink(msg);
  });

  void check();
}

/** Looks once. Safe to call again. */
export async function check(): Promise<AutoUpdate> {
  if (!started) return state;
  try { await autoUpdater.checkForUpdates(); }
  catch (e) { await fallBackToLink(e instanceof Error ? e.message : String(e)); }
  return state;
}

/** Quits and runs the installer. Only ever called from a button. */
export function install(): { ok: boolean; error?: string } {
  if (state.stage !== "ready") return { ok: false, error: "aucune mise à jour prête" };
  try {
    /* silent: the installer puts itself back in the folder it is already
       in, with no window; then the app comes back up */
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: readableError(e instanceof Error ? e.message : String(e)) };
  }
}
