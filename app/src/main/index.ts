/* The overlay window, the settings window, and the tray icon that reaches
 * them both.
 *
 * The overlay is transparent, always on top and click-through, so it sits
 * over the game without ever stealing a click. That also means nothing in
 * it can be clicked — which is why the settings live in their own ordinary
 * window, opened from the tray.
 *
 * League must run in borderless mode: no window can be drawn over exclusive
 * fullscreen, which is a limit of the display mode, not of this app.
 */

import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } from "electron";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pollGame, teamLookup, activeChampion, type Status } from "./liveClient.js";
import { buildsFor, fetchLibrary } from "./siteClient.js";
import * as auth from "./auth.js";
import { checkForUpdate, updateState } from "./updates.js";
import { championKey, pickBuild, nextSkill, orderSummary, itemNames,
         type PublishedBuild } from "../shared/builds.js";
import { objectiveStates, dueAlerts, mmss, OBJECTIVES } from "../shared/objectives.js";
import { leadFor, LEAD_MIN, LEAD_MAX } from "../shared/settings.js";
import { loadSettings, saveSettings, settingsPath } from "./store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const renderer = (f: string) => path.join(here, "..", "renderer", f);
/* packaged, the icon sits beside the compiled code; in development it is
   two levels up, in build/ */
const iconPath = () => {
  const packed = path.join(process.resourcesPath || "", "build", "icon.png");
  const local = path.join(here, "..", "..", "..", "build", "icon.png");
  return existsSync(packed) ? packed : local;
};

/* only the plumbing stays in the environment; everything a player would
   change lives in the settings window */
const LIVE_PORT = Number(process.env.OVERLAY_PORT ?? 2999);
const SCHEME: "http" | "https" = process.env.OVERLAY_SCHEME === "http" ? "http" : "https";
/* prints every read to the console — the way to find out what the game
   really calls its events if an alert ever fails to fire */
const DEBUG = process.env.OVERLAY_DEBUG === "1";

let overlay: BrowserWindow | null = null;
let settingsWin: BrowserWindow | null = null;
let tray: Tray | null = null;
let stopPolling: (() => void) | null = null;
const announced = new Set<string>();

/* what the site says about the champion being played; filled once per
   game, and never allowed to take the timer down with it */
let siteBuilds: PublishedBuild[] = [];
let siteFor = "";
let siteNote = "";

/* ------------------------------------------------------------------ */

function createOverlay(): void {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  overlay = new BrowserWindow({
    width: 320, height: 420, x: width - 340, y: 90,
    frame: false, transparent: true, resizable: false, movable: false,
    focusable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false,
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false
    }
  });
  /* "screen-saver" is the highest ordinary level: it clears borderless
     games, which plain alwaysOnTop does not always manage */
  overlay.setAlwaysOnTop(true, "screen-saver");
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.setIgnoreMouseEvents(true, { forward: true });
  overlay.loadFile(renderer("index.html"));
  overlay.on("closed", () => { overlay = null; });
}

function openSettings(): void {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 440, height: 600, resizable: false, title: "Réglages — overlay",
    icon: iconPath(),
    autoHideMenuBar: true, backgroundColor: "#0d1117",
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false
    }
  });
  settingsWin.loadFile(renderer("settings.html"));
  settingsWin.on("closed", () => { settingsWin = null; });
}

function buildTray(): void {
  /* the site's own icon, so the app and otp-lol-calc look like one thing */
  const img = nativeImage.createFromPath(iconPath());
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 }));
  tray.setToolTip("Overlay LoL — minuteur d'objectifs");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Réglages…", click: openSettings },
    { label: "Version " + app.getVersion(), enabled: false },
    { label: "Ouvrir le fichier de réglages", click: () => shell.showItemInFolder(settingsPath()) },
    { type: "separator" },
    { label: "Quitter", click: () => app.quit() }
  ]));
  tray.on("double-click", openSettings);
}

/* ------------------------------------------------------------------ */

function send(win: BrowserWindow | null, channel: string, payload: unknown): void {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function startPolling(): void {
  stopPolling = pollGame(
    snap => {
      const s = loadSettings();
      const who = activeChampion(snap);
      const key = who ? championKey(who.champion) : "";

      /* fetch once per champion, in the background: the site being slow or
         down must never delay an objective alert */
      if (s.builds.enabled && key && key !== siteFor) {
        siteFor = key; siteBuilds = []; siteNote = "";
        /* published builds need nobody; the private library is added on
           top only when a session can be resumed without asking */
        buildsFor(key)
          .then(async b => {
            if (siteFor !== key) return;
            siteBuilds = b;
            if (!auth.canResume()) return;
            const tok = await auth.token();
            if (!tok || siteFor !== key) return;
            try {
              const own = await fetchLibrary(key, tok);
              if (siteFor === key) siteBuilds = own.concat(siteBuilds);
            } catch { /* the public ones are still there */ }
          })
          .catch(e => { if (siteFor === key) siteNote = e instanceof Error ? e.message : String(e); });
      }
      if (!s.builds.enabled) { siteBuilds = []; siteFor = ""; }

      const chosen = s.builds.enabled && who
        ? pickBuild(siteBuilds, who.champion, s.builds.preferred[key])
        : null;
      const guide = chosen && who ? {
        id: chosen.id,
        name: chosen.name,
        author: chosen.author,
        patch: chosen.patch,
        summary: orderSummary(chosen.data.order),
        next: nextSkill(chosen.data.order, who.level),
        level: who.level,
        items: itemNames(chosen),
        mine: !!chosen.mine,
        count: siteBuilds.length
      } : null;
      const states = objectiveStates(snap.gameTime, snap.events, teamLookup(snap.players));
      const alerts = dueAlerts(states, id => leadFor(s, id), announced);
      if (DEBUG) {
        const names = [...new Set(snap.events.map(e => e.EventName))].join(", ");
        console.log(`[${mmss(snap.gameTime)}]`,
          states.filter(x => x.inSeconds !== null).map(x => `${x.id}=${x.status === "up" ? "dispo" : x.inSeconds + "s"}`).join(" "),
          alerts.length ? "| ALERTE " + alerts.map(a => a.id).join(",") : "",
          "| evenements vus:", names || "aucun");
      }
      send(overlay, "tick", {
        gameTime: snap.gameTime, states, alerts, settings: s,
        guide, champion: who ? who.champion : null, siteNote,
        update: updateState().available
      });
    },
    (status: Status, detail?: string) => {
      /* a new game starts a fresh set of announcements */
      if (status === "waiting") { announced.clear(); siteFor = ""; siteBuilds = []; siteNote = ""; }
      send(overlay, "status", { status, detail, settings: loadSettings() });
    },
    { port: LIVE_PORT, scheme: SCHEME }
  );
}

/* ------------------------------------------------------------------ */

ipcMain.handle("settings:get", () => ({
  settings: loadSettings(),
  objectives: OBJECTIVES.map(o => ({ id: o.id, label: o.label })),
  bounds: { min: LEAD_MIN, max: LEAD_MAX }
}));

ipcMain.handle("update:state", () => updateState());
ipcMain.handle("update:open", () => {
  const u = updateState().available;
  if (u && u.url) shell.openExternal(u.url);
  return { ok: !!(u && u.url) };
});

ipcMain.handle("auth:status", async () => ({
  signedIn: !!auth.who() || auth.canResume(),
  name: auth.who(),
  canRemember: auth.canRemember(),
  redirect: auth.REDIRECT_URL
}));

ipcMain.handle("auth:in", async () => {
  try {
    const s = await auth.signIn();
    siteFor = "";                      /* re-read with the account's builds */
    return { ok: true, name: s.name };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

ipcMain.handle("auth:out", async () => {
  auth.signOut();
  siteFor = ""; siteBuilds = [];
  return { ok: true };
});

ipcMain.handle("builds:list", async (_e, champ: string) => {
  const key = championKey(String(champ || ""));
  if (!key) return { champion: "", builds: [] };
  try { return { champion: key, builds: await buildsFor(key) }; }
  catch (e) { return { champion: key, builds: [], error: e instanceof Error ? e.message : String(e) }; }
});

ipcMain.handle("settings:set", (_e, next) => {
  const saved = saveSettings(next);
  /* a changed warning must be able to fire again for a spawn already
     passed over, so the record of what has been said is dropped */
  announced.clear();
  send(overlay, "settings", saved);
  return saved;
});

app.whenReady().then(() => {
  createOverlay();
  buildTray();
  startPolling();
  /* handy while developing, and on a desktop with no system tray */
  if (process.env.OVERLAY_SETTINGS === "1") openSettings();

  /* one look for a newer version, a moment after start so it never
     competes with getting the overlay on screen */
  setTimeout(() => {
    checkForUpdate(app.getVersion()).then(st => {
      if (st.available) send(overlay, "update", st);
    });
  }, 4000);
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createOverlay(); });
});

/* the tray keeps the app alive: closing the settings window is not quitting */
app.on("window-all-closed", () => { /* deliberately empty */ });
app.on("before-quit", () => { if (stopPolling) stopPolling(); });
