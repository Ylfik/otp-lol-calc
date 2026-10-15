/* Comparing two versions, which is where this sort of thing goes wrong.
 *
 * "0.10.0" is newer than "0.9.0" even though it sorts earlier as text, and
 * "v0.1.0" and "overlay-v0.1.0" name the same release as "0.1.0". Both
 * mistakes are easy to make and silent when made, so the rules live here
 * on their own and are tested.
 */

export interface Version { major: number; minor: number; patch: number; }

/** Reads a version out of a tag, whatever prefix it carries. */
export function parseVersion(raw: string): Version | null {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(String(raw || ""));
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

/** -1, 0 or 1, the way a comparison function is expected to answer. */
export function compareVersions(a: string, b: string): number {
  const x = parseVersion(a), y = parseVersion(b);
  if (!x || !y) return 0;          /* unreadable: treat as equal, never "newer" */
  if (x.major !== y.major) return x.major < y.major ? -1 : 1;
  if (x.minor !== y.minor) return x.minor < y.minor ? -1 : 1;
  if (x.patch !== y.patch) return x.patch < y.patch ? -1 : 1;
  return 0;
}

/** True only when `candidate` is genuinely ahead of what is installed. */
export const isNewer = (candidate: string, installed: string): boolean =>
  compareVersions(candidate, installed) > 0;

export interface ReleaseInfo {
  tag: string;
  version: string;
  url: string;
  publishedAt?: string;
}

/**
 * Picks the newest release this app should care about.
 *
 * A repository shared with the website carries tags for both, so only
 * those under `prefix` are considered. Drafts and pre-releases are left
 * alone: they are not meant for whoever installed the app.
 */
export function latestRelease(rows: unknown, prefix = "overlay-v"): ReleaseInfo | null {
  if (!Array.isArray(rows)) return null;
  let best: ReleaseInfo | null = null;
  for (const r of rows as Record<string, unknown>[]) {
    const tag = String(r.tag_name || "");
    if (!tag.startsWith(prefix)) continue;
    if (r.draft === true || r.prerelease === true) continue;
    const v = parseVersion(tag);
    if (!v) continue;
    const info: ReleaseInfo = {
      tag,
      version: `${v.major}.${v.minor}.${v.patch}`,
      url: String(r.html_url || ""),
      publishedAt: r.published_at ? String(r.published_at) : undefined
    };
    if (!best || isNewer(info.version, best.version)) best = info;
  }
  return best;
}
