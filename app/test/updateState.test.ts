/* Ce que l'app dit d'une mise a jour, et quel bouton est vivant. Une
   erreur ici n'arrete rien : elle propose simplement d'installer quelque
   chose qui n'est pas la, ou se tait quand il faudrait parler. */

import test from "node:test";
import assert from "node:assert/strict";
import { describe, idleUpdate, mo, readableError, type AutoUpdate }
  from "../src/shared/updateState.js";

const at = (p: Partial<AutoUpdate>): AutoUpdate => ({ ...idleUpdate(), ...p });

test("tant qu'il n'y a rien a dire, la section reste cachee", () => {
  for (const stage of ["idle", "none", "checking"] as const) {
    const s = describe(at({ stage }), "0.2.0");
    assert.equal(s.show, false, stage);
    assert.equal(s.canInstall, false, stage);
  }
});

test("une version trouvee s'annonce avant meme d'etre telechargee", () => {
  const s = describe(at({ stage: "available", version: "0.3.0" }), "0.2.0");
  assert.equal(s.show, true);
  assert.match(s.text, /0\.3\.0/);
  assert.equal(s.percent, 0);
  assert.equal(s.canInstall, false);
});

test("le telechargement montre ou il en est", () => {
  const s = describe(at({ stage: "downloading", version: "0.3.0", percent: 42.4, speed: 3 * 1024 * 1024 }), "0.2.0");
  assert.equal(s.percent, 42.4);
  assert.match(s.detail, /42 %/);
  assert.match(s.detail, /3\.0 Mo\/s/);
  assert.equal(s.canInstall, false);
});

test("un pourcentage aberrant est ramene dans la barre", () => {
  assert.equal(describe(at({ stage: "downloading", percent: -5 }), "0.2.0").percent, 0);
  assert.equal(describe(at({ stage: "downloading", percent: 140 }), "0.2.0").percent, 100);
});

test("le bouton d'installation n'apparait qu'une fois le fichier pret", () => {
  const pret = describe(at({ stage: "ready", version: "0.3.0" }), "0.2.0");
  assert.equal(pret.canInstall, true);
  assert.match(pret.detail, /0\.2\.0/);          /* ce qu'on a encore */
  assert.match(pret.text, /0\.3\.0/);            /* ce qu'on aura */
  /* a aucun autre moment */
  for (const stage of ["idle", "checking", "none", "available", "downloading", "manual", "error"] as const)
    assert.equal(describe(at({ stage, version: "0.3.0" }), "0.2.0").canInstall, false, stage);
});

test("sans telechargement automatique, c'est le lien qui est propose", () => {
  const s = describe(at({ stage: "manual", version: "0.3.0", url: "https://x/rel" }), "0.2.0");
  assert.equal(s.canOpen, true);
  assert.equal(s.canInstall, false);
  assert.match(s.detail, /main/);
  /* sans lien, pas de bouton qui ne mene nulle part */
  assert.equal(describe(at({ stage: "manual", version: "0.3.0" }), "0.2.0").canOpen, false);
});

test("une erreur se montre, avec sa raison", () => {
  const s = describe(at({ stage: "error", error: "GitHub est injoignable" }), "0.2.0");
  assert.equal(s.show, true);
  assert.equal(s.detail, "GitHub est injoignable");
  assert.equal(s.canInstall, false);
});

test("les debits se lisent", () => {
  assert.equal(mo(0), "");
  assert.equal(mo(-1), "");
  assert.equal(mo(512 * 1024), "512 Ko/s");
  assert.equal(mo(5.25 * 1024 * 1024), "5.3 Mo/s");
});

test("les erreurs d'electron-updater deviennent du francais", () => {
  assert.match(readableError("Error: ERR_UPDATER_CHANNEL_FILE_NOT_FOUND bla"), /fichiers de mise a jour|fichiers de mise à jour/);
  assert.match(readableError("ERR_UPDATER_NO_PUBLISHED_VERSIONS"), /aucune version publiée/);
  assert.match(readableError("getaddrinfo ENOTFOUND github.com"), /injoignable/);
  assert.match(readableError("sha512 checksum mismatch"), /abîmé/);
  assert.match(readableError("Error: ENOENT dev-app-update.yml"), /hors installation/);
});

test("une erreur inconnue est raccourcie, jamais une pile d'appels", () => {
  const long = "Quelque chose a casse\n    at machin (truc.js:1:1)\n    at bidule";
  const out = readableError(long);
  assert.equal(out, "Quelque chose a casse");
  assert.ok(readableError("x".repeat(400)).length <= 120);
  assert.equal(readableError(""), "raison inconnue");
});
