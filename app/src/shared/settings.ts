/* What the user has chosen, and what it means when they have chosen nothing.
 *
 * Kept next to the timer logic rather than in the Electron layer so that the
 * tests can use it, and so the shape is the same on both sides of the bridge.
 */

import type { ObjectiveId } from "./objectives.js";
import { OBJECTIVES } from "./objectives.js";

export interface ObjectiveSetting {
  /** an alert at all for this objective */
  enabled: boolean;
  /** seconds of warning, or null to follow the global setting */
  lead: number | null;
}

export interface BuildSettings {
  /** show what otp-lol-calc says about the champion being played */
  enabled: boolean;
  /** championKey -> the id of the published build to follow, when the
      user has picked one rather than taking the most liked */
  preferred: Record<string, string>;
}

export interface Settings {
  /** the warning used by any objective that has no setting of its own */
  leadSeconds: number;
  objectives: Record<ObjectiveId, ObjectiveSetting>;
  lang: "fr" | "en";
  /** false hides the countdown list and leaves only the warnings */
  showList: boolean;
  builds: BuildSettings;
}

export const LEAD_MIN = 5;
export const LEAD_MAX = 120;

export function defaultSettings(): Settings {
  const objectives = {} as Record<ObjectiveId, ObjectiveSetting>;
  for (const o of OBJECTIVES) objectives[o.id] = { enabled: true, lead: null };
  return {
    leadSeconds: 30, objectives, lang: "fr", showList: true,
    builds: { enabled: true, preferred: {} }
  };
}

const clampLead = (n: unknown): number =>
  Math.min(LEAD_MAX, Math.max(LEAD_MIN, Math.round(Number(n))));

/** Accepts whatever was on disk and returns something usable, so an
 *  edited or outdated file can never stop the app from starting. */
export function normalise(raw: unknown): Settings {
  const d = defaultSettings();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;

  if (Number.isFinite(Number(r.leadSeconds))) d.leadSeconds = clampLead(r.leadSeconds);
  if (r.lang === "en" || r.lang === "fr") d.lang = r.lang;
  if (typeof r.showList === "boolean") d.showList = r.showList;

  const b = r.builds;
  if (b && typeof b === "object") {
    const bb = b as Record<string, unknown>;
    if (typeof bb.enabled === "boolean") d.builds.enabled = bb.enabled;
    if (bb.preferred && typeof bb.preferred === "object") {
      for (const [k, v] of Object.entries(bb.preferred as Record<string, unknown>))
        if (typeof v === "string" && v) d.builds.preferred[k] = v;
    }
  }

  const objs = r.objectives;
  if (objs && typeof objs === "object") {
    for (const o of OBJECTIVES) {
      const got = (objs as Record<string, unknown>)[o.id];
      if (!got || typeof got !== "object") continue;
      const g = got as Record<string, unknown>;
      if (typeof g.enabled === "boolean") d.objectives[o.id].enabled = g.enabled;
      d.objectives[o.id].lead =
        g.lead === null || g.lead === undefined ? null : clampLead(g.lead);
    }
  }
  return d;
}

/** The warning actually used for one objective. */
export function leadFor(s: Settings, id: ObjectiveId): number {
  const own = s.objectives[id];
  if (!own || !own.enabled) return 0;
  return own.lead === null ? s.leadSeconds : own.lead;
}
