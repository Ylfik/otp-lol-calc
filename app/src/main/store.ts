/* Keeps the settings on disk, in the folder Electron sets aside for this
   app — not next to the program, so an update never wipes them. */

import { app } from "electron";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { normalise, defaultSettings, type Settings } from "../shared/settings.js";

let cached: Settings | null = null;

const file = () => path.join(app.getPath("userData"), "settings.json");

export function loadSettings(): Settings {
  if (cached) return cached;
  try {
    cached = normalise(JSON.parse(readFileSync(file(), "utf8")));
  } catch {
    /* no file yet, or someone edited it into nonsense: start from the
       defaults rather than refusing to open */
    cached = defaultSettings();
  }
  return cached;
}

export function saveSettings(next: unknown): Settings {
  cached = normalise(next);
  try {
    mkdirSync(path.dirname(file()), { recursive: true });
    writeFileSync(file(), JSON.stringify(cached, null, 2), "utf8");
  } catch (e) {
    /* a read-only profile should not take the app down; the choice simply
       does not survive a restart, and the user is told */
    console.error("réglages non enregistrés :", e instanceof Error ? e.message : e);
  }
  return cached;
}

export const settingsPath = () => file();
