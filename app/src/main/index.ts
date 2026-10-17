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
import * as lcu from "./lcu.js";
import { resolveItems } from "./items.js";
import { toRunePage, treeLookup, pageLooksValid, RuneError } from "../shared/runes.js";
import { readFileSync } from "node:fs";
import nodeHttps from "node:https";
import nodeHttp from "node:http";
import { championKey, pickBuild, nextSkill, orderSummary, itemNames,
         type PublishedBuild } from "../shared/builds.js";
import { objectiveStates, activeAlerts, mmss, OBJECTIVES } from "../shared/objectives.js";
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
/* Riot's static data; overridable so the whole draft path can be exercised offline */
const DDRAGON_BASE = process.env.OVERLAY_DDRAGON || "https://ddragon.leagueoflegends.com";

let overlay: BrowserWindow | null = null;
let alertWin: BrowserWindow | null = null;
let hub: BrowserWindow | null = null;

/* what the client is doing, refreshed on its own slower beat */
let draft: {
  active: boolean; champion: string; championId: number;
  builds: { id: string; name: string; author: string; mine: boolean;
            summary: string; runes: boolean; items: number }[];
} = { active: false, champion: "", championId: 0, builds: [] };
/* the draft's own copy: the in-game picker fills siteBuilds for the
   champion being played, and the two must not overwrite each other */
let draftBuilds: PublishedBuild[] = [];
let clientSeen = false;
let gameSeen = false;
let runeTrees: ((id: number) => string | undefined) | null = null;
let settingsWin: BrowserWindow | null = null;
let tray: Tray | null = null;
let stopPolling: (() => void) | null = null;

/* what the site says about the champion being played; filled once per
   game, and never allowed to take the timer down with it */
let siteBuilds: PublishedBuild[] = [];
let siteFor = "";
let siteNote = "";

/* ------------------------------------------------------------------ */

/* shared by both windows: see through, above the game, never clickable */
function ghost(win: BrowserWindow): void {
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });
}

function createOverlay(): void {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  /* narrow on purpose: it lives over the game for a whole match */
  overlay = new BrowserWindow({
    width: 210, height: 300, x: width - 222, y: 86,
    frame: false, transparent: true, resizable: false, movable: false,
    focusable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false,
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false
    }
  });
  /* "screen-saver" is the highest ordinary level: it clears borderless
     games, which plain alwaysOnTop does not always manage */
  ghost(overlay);
  overlay.loadFile(renderer("index.html"));
  overlay.on("closed", () => { overlay = null; });
}

/* The spawn warnings get a window of their own, centred at the top of the
   screen. A corner is where you put something you may read; the middle is
   where you put something you must not miss. It is empty — and so
   invisible — except in the seconds before an objective returns. */
function createAlertWindow(): void {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const w = 420;
  alertWin = new BrowserWindow({
    width: w, height: 150, x: Math.round((width - w) / 2), y: 8,
    frame: false, transparent: true, resizable: false, movable: false,
    focusable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false,
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false
    }
  });
  ghost(alertWin);
  alertWin.loadFile(renderer("alert.html"));
  alertWin.on("closed", () => { alertWin = null; });
}

/* The window that says the app is alive. Tray-only was a mistake: an app
   you cannot see is an app you assume is not running. */
function openHub(): void {
  if (hub && !hub.isDestroyed()) { hub.show(); hub.focus(); return; }
  hub = new BrowserWindow({
    width: 430, height: 580, resizable: true, minWidth: 380, minHeight: 460,
    title: "LoL Overlay", autoHideMenuBar: true, backgroundColor: "#0b1118",
    icon: iconPath(),
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false
    }
  });
  hub.loadFile(renderer("hub.html"));
  hub.webContents.on("did-finish-load", pushHub);
  hub.on("closed", () => { hub = null; });
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
  tray.setToolTip("LoL Overlay — en marche");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Ouvrir LoL Overlay", click: openHub },
    { label: "Réglages…", click: openSettings },
    { label: "Version " + app.getVersion(), enabled: false },
    { label: "Ouvrir le fichier de réglages", click: () => shell.showItemInFolder(settingsPath()) },
    { type: "separator" },
    { label: "Quitter", click: () => app.quit() }
  ]));
  tray.on("double-click", openHub);
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
      const alerts = activeAlerts(states, id => leadFor(s, id));
      if (DEBUG) {
        const names = [...new Set(snap.events.map(e => e.EventName))].join(", ");
        console.log(`[${mmss(snap.gameTime)}]`,
          states.filter(x => x.inSeconds !== null).map(x => `${x.id}=${x.status === "up" ? "dispo" : x.inSeconds + "s"}`).join(" "),
          alerts.length ? "| ALERTE " + alerts.map(a => a.id).join(",") : "",
          "| evenements vus:", names || "aucun");
      }
      const payload = {
        gameTime: snap.gameTime, states, alerts, settings: s,
        guide, champion: who ? who.champion : null, siteNote,
        update: updateState().available
      };
      send(overlay, "tick", payload);
      send(alertWin, "tick", payload);
      gameSeen = true;
      pushHub();
    },
    (status: Status, detail?: string) => {
      /* a new game starts a fresh set of announcements */
      if (status === "waiting") { siteFor = ""; siteBuilds = []; siteNote = ""; }
      const st = { status, detail, settings: loadSettings() };
      send(overlay, "status", st);
      send(alertWin, "status", st);
      gameSeen = status === "running";
      pushHub();
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

/* ------------------------------------------------------------------
   Watching the League client: champion select, and what to offer there.
   Slower than the game poll — a draft lasts a minute, not a second.
   ------------------------------------------------------------------ */
let lastChampId = -1;

async function watchClient(): Promise<void> {
  try {
    const lock = lcu.findLockfile();
    clientSeen = !!lock;
    if (!lock) { draft = { active: false, champion: "", championId: 0, builds: [] }; lastChampId = -1; return; }

    const cs = await lcu.champSelect(lock);
    if (!cs.active) {
      draft = { active: false, champion: "", championId: 0, builds: [] };
      lastChampId = -1;
      return;
    }
    if (cs.championId === lastChampId) { draft.active = true; return; }
    lastChampId = cs.championId;

    if (!cs.championId) {
      draft = { active: true, champion: "", championId: 0, builds: [] };
      return;
    }
    const name = await championName(cs.championId);
    const key = championKey(name);
    let list = await buildsFor(key);
    if (auth.canResume()) {
      const tok = await auth.token();
      if (tok) { try { list = (await fetchLibrary(key, tok)).concat(list); } catch { /* public only */ } }
    }
    draftBuilds = list;
    draft = {
      active: true, champion: name, championId: cs.championId,
      builds: list.map(b => ({
        id: b.id, name: b.name, author: b.author, mine: !!b.mine,
        summary: orderSummary(b.data.order),
        runes: Array.isArray(b.data.runes) && b.data.runes.filter((r: any) => r && r.id != null).length >= 6,
        items: itemNames(b).length
      }))
    };
  } catch {
    /* the client closing mid-read is ordinary */
    draft = { active: false, champion: "", championId: 0, builds: [] };
    lastChampId = -1;
  }
}

/* Riot numbers champions; the site names them. */
let champById: Map<number, string> | null = null;
async function championName(id: number): Promise<string> {
  if (!champById) {
    const rows = await ddragon("champion.json");
    champById = new Map();
    for (const c of Object.values<any>(rows?.data || {}))
      champById.set(Number(c.key), String(c.id));
  }
  return champById.get(id) || "";
}

function ddragon(file: string): Promise<any> {
  const base = DDRAGON_BASE;
  const get = (url: string) => new Promise<any>((ok, no) => httpsGet(new URL(url), ok, no));
  return get(base + "/api/versions.json")
    .then(v => get(`${base}/cdn/${v[0]}/data/en_US/${file}`));
}
function httpsGet(u: URL, ok: (v: any) => void, no: (e: Error) => void): void {
  const mod = u.protocol === "http:" ? nodeHttp : nodeHttps;
  const req = mod.get(
    { hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, timeout: 8000 },
    res => {
      let t = ""; res.setEncoding("utf8");
      res.on("data", c => { t += c; });
      res.on("end", () => { try { ok(JSON.parse(t)); } catch { no(new Error("ddragon illisible")); } });
    });
  req.on("timeout", () => req.destroy(new Error("ddragon injoignable")));
  req.on("error", no);
}

function pushHub(): void {
  send(hub, "hub", { state: { client: clientSeen, game: gameSeen }, draft });
}

ipcMain.handle("hub:info", () => ({
  version: app.getVersion(),
  icon: (() => { try { return "data:image/png;base64," + readFileSync(iconPath()).toString("base64"); }
                 catch { return null; } })()
}));
ipcMain.handle("hub:settings", () => { openSettings(); });
ipcMain.handle("hub:hide", () => { if (hub) hub.hide(); });

ipcMain.handle("build:import", async (_e, buildId: string) => {
  const lock = lcu.findLockfile();
  if (!lock) return { ok: false, error: "client League introuvable" };
  const b = draftBuilds.find(x => x.id === buildId);
  if (!b) return { ok: false, error: "build introuvable" };

  const done: string[] = [];
  try {
    /* runes first: they are what a draft is short on time for */
    if (!runeTrees) runeTrees = treeLookup(await ddragon("runesReforged.json"));
    try {
      const page = toRunePage("OTP · " + b.name, b.data.runes as any, b.data.shards as any, runeTrees);
      if (!pageLooksValid(page)) throw new RuneError("page incomplète");
      await lcu.applyRunePage(lock, page, "OTP · ");
      done.push("runes");
    } catch (e) {
      if (!(e instanceof RuneError)) throw e;
      /* a build with no runes is common; it must not stop the items */
    }

    const names = itemNames(b);
    if (names.length) {
      const sid = await lcu.summonerId(lock);
      const { ids, missing } = await resolveItems(names);
      if (sid && ids.length) {
        await lcu.applyItemSet(lock, sid, draft.championId, "OTP · " + b.name, ids);
        done.push(`${ids.length} objets` + (missing.length ? ` (${missing.length} non reconnus)` : ""));
      }
    }
    if (!done.length) return { ok: false, error: "rien à importer dans ce build" };
    return { ok: true, done };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

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
  send(overlay, "settings", saved);
  return saved;
});

app.whenReady().then(() => {
  createOverlay();
  createAlertWindow();
  buildTray();
  openHub();                       /* visible at launch: the app announces itself */
  startPolling();

  /* the client beats slower than the game: a draft lasts a minute */
  const beat = () => watchClient().then(pushHub).finally(() => setTimeout(beat, 3000));
  beat();
  /* handy while developing, and on a desktop with no system tray */
  if (process.env.OVERLAY_SETTINGS === "1") openSettings();

  /* one look for a newer version, a moment after start so it never
     competes with getting the overlay on screen */
  setTimeout(() => {
    checkForUpdate(app.getVersion()).then(st => {
      if (st.available) send(overlay, "update", st);
    });
  }, 4000);
  app.on("activate", () => {
    if (!overlay) createOverlay();
    if (!alertWin) createAlertWindow();
  });
});

/* the tray keeps the app alive: closing the settings window is not quitting */
app.on("window-all-closed", () => { /* deliberately empty */ });
app.on("before-quit", () => { if (stopPolling) stopPolling(); });
