/* Where an update has got to, and how to say it in one line.
 *
 * Kept away from Electron on purpose: the wording and the rules about
 * which button is live are the part that can be wrong in a way nobody
 * notices, so they are testable on their own.
 */

export type Stage =
  | "idle"        /* nothing looked at yet */
  | "checking"
  | "none"        /* looked, and this is the newest version */
  | "available"   /* a newer one exists, the download is starting */
  | "downloading"
  | "ready"       /* downloaded and checked: one restart away */
  | "manual"      /* a newer one exists but this build cannot fetch it */
  | "error";

export interface AutoUpdate {
  stage: Stage;
  /** the version being offered, never the installed one */
  version: string | null;
  /** 0 to 100, only meaningful while downloading */
  percent: number;
  /** bytes per second, as the downloader reports them */
  speed: number;
  /** where to send someone whose app cannot update itself */
  url: string | null;
  error: string | null;
}

export const idleUpdate = (): AutoUpdate =>
  ({ stage: "idle", version: null, percent: 0, speed: 0, url: null, error: null });

/** A size a person can read, which is never "17825792". */
export function mo(bytesPerSecond: number): string {
  if (!(bytesPerSecond > 0)) return "";
  const mb = bytesPerSecond / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} Mo/s` : `${Math.round(bytesPerSecond / 1024)} Ko/s`;
}

export interface Said {
  /** the line to show, empty when there is nothing worth saying */
  text: string;
  /** the second, quieter line */
  detail: string;
  /** 0–100 while a download is running, null when there is no bar */
  percent: number | null;
  /** the restart-and-install button */
  canInstall: boolean;
  /** the "open the download page" button, for builds that cannot self-update */
  canOpen: boolean;
  /** whether the section should be on screen at all */
  show: boolean;
}

export function describe(u: AutoUpdate, installed: string): Said {
  const v = u.version || "?";
  const quiet = (): Said =>
    ({ text: "", detail: "", percent: null, canInstall: false, canOpen: false, show: false });

  switch (u.stage) {
    case "idle":
    case "none":
      /* nothing to say is said with nothing: the section stays hidden */
      return quiet();

    case "checking":
      return { text: "Recherche d'une mise à jour…", detail: "", percent: null,
               canInstall: false, canOpen: false, show: false };

    case "available":
      return { text: `Version ${v} disponible`, detail: "téléchargement en cours…",
               percent: 0, canInstall: false, canOpen: false, show: true };

    case "downloading":
      return {
        text: `Téléchargement de la version ${v}`,
        detail: `${Math.round(u.percent)} %` + (mo(u.speed) ? " · " + mo(u.speed) : ""),
        percent: Math.max(0, Math.min(100, u.percent)),
        canInstall: false, canOpen: false, show: true
      };

    case "ready":
      return {
        text: `Version ${v} prête`,
        detail: `vous avez la ${installed} · l'app redémarrera pour l'installer`,
        percent: null, canInstall: true, canOpen: false, show: true
      };

    case "manual":
      return {
        text: `Version ${v} disponible`,
        detail: `vous avez la ${installed} · à installer à la main`,
        percent: null, canInstall: false, canOpen: !!u.url, show: true
      };

    case "error":
      return {
        text: "Mise à jour impossible",
        detail: u.error || "raison inconnue",
        percent: null, canInstall: false, canOpen: !!u.url, show: true
      };
  }
}

/* The errors electron-updater raises are codes and stack traces. Only a
   few of them mean something a player can act on; the rest are noise, and
   saying "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND" to someone is saying
   nothing. */
export function readableError(message: string): string {
  const m = String(message || "");
  if (/ERR_UPDATER_CHANNEL_FILE_NOT_FOUND|Cannot find latest\.yml/i.test(m))
    return "cette version n'a pas été publiée avec ses fichiers de mise à jour";
  if (/ERR_UPDATER_NO_PUBLISHED_VERSIONS|please ensure a production release exists/i.test(m))
    return "aucune version publiée sur GitHub";
  if (/ERR_UPDATER_INVALID_SIGNATURE/i.test(m))
    return "le fichier téléchargé n'est pas celui attendu";
  if (/ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNREFUSED|ENETUNREACH|net::/i.test(m))
    return "GitHub est injoignable";
  if (/sha512|checksum/i.test(m))
    return "le téléchargement est arrivé abîmé";
  if (/dev-app-update\.yml|is not packed|isPackaged/i.test(m))
    return "mise à jour automatique indisponible hors installation";
  /* one line, never a stack */
  return m.split("\n")[0].slice(0, 120) || "raison inconnue";
}
