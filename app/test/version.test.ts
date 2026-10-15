/* La comparaison de versions : l'endroit ou une mise a jour se rate. */

import test from "node:test";
import assert from "node:assert/strict";
import { parseVersion, compareVersions, isNewer, latestRelease } from "../src/shared/version.js";

test("une version se lit quel que soit son prefixe", () => {
  assert.deepEqual(parseVersion("0.1.0"), { major: 0, minor: 1, patch: 0 });
  assert.deepEqual(parseVersion("v0.1.0"), { major: 0, minor: 1, patch: 0 });
  assert.deepEqual(parseVersion("overlay-v2.13.4"), { major: 2, minor: 13, patch: 4 });
  assert.equal(parseVersion("pas une version"), null);
});

test("0.10.0 est plus recent que 0.9.0", () => {
  /* le piege : en simple texte, "0.10.0" vient avant "0.9.0" */
  assert.equal(isNewer("0.10.0", "0.9.0"), true);
  assert.equal(isNewer("0.9.0", "0.10.0"), false);
  assert.equal(compareVersions("1.0.0", "0.99.99"), 1);
});

test("identique n'est pas plus recent", () => {
  assert.equal(isNewer("0.1.0", "0.1.0"), false);
  assert.equal(isNewer("overlay-v0.1.0", "0.1.0"), false, "le prefixe ne change rien");
});

test("une version illisible ne declenche jamais de mise a jour", () => {
  assert.equal(isNewer("", "0.1.0"), false);
  assert.equal(isNewer("bientot", "0.1.0"), false);
});

const rel = (tag: string, over: Record<string, unknown> = {}) => ({
  tag_name: tag, html_url: "https://github.com/x/y/releases/tag/" + tag,
  draft: false, prerelease: false, published_at: "2026-10-15T00:00:00Z", ...over
});

test("on ne retient que les versions de l'app", () => {
  /* le depot est partage avec le site : ses etiquettes ne nous concernent pas */
  const rows = [rel("overlay-v0.1.0"), rel("site-v9.9.9"), rel("v5.0.0")];
  const got = latestRelease(rows);
  assert.equal(got && got.version, "0.1.0");
});

test("la plus recente gagne, pas la premiere de la liste", () => {
  const rows = [rel("overlay-v0.2.0"), rel("overlay-v0.10.0"), rel("overlay-v0.9.0")];
  assert.equal(latestRelease(rows)?.version, "0.10.0");
});

test("brouillons et preversions sont ignores", () => {
  const rows = [
    rel("overlay-v0.1.0"),
    rel("overlay-v0.2.0", { draft: true }),
    rel("overlay-v0.3.0", { prerelease: true })
  ];
  assert.equal(latestRelease(rows)?.version, "0.1.0");
});

test("aucune release : rien, pas une erreur", () => {
  assert.equal(latestRelease([]), null);
  assert.equal(latestRelease([rel("site-v1.0.0")]), null);
  assert.equal(latestRelease(null), null);
  assert.equal(latestRelease({ message: "Not Found" }), null);
});

test("le lien de telechargement est conserve", () => {
  const got = latestRelease([rel("overlay-v1.2.3")]);
  assert.match(got!.url, /releases\/tag\/overlay-v1\.2\.3$/);
});
