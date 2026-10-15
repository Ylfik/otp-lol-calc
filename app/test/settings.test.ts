/* Les réglages décident quand une alerte part — autant les tester. */

import test from "node:test";
import assert from "node:assert/strict";
import { defaultSettings, normalise, leadFor, LEAD_MIN, LEAD_MAX } from "../src/shared/settings.js";
import { objectiveStates, dueAlerts, type GameEvent } from "../src/shared/objectives.js";

test("par defaut, trente secondes pour tout le monde", () => {
  const s = defaultSettings();
  assert.equal(s.leadSeconds, 30);
  assert.equal(leadFor(s, "baron"), 30);
  assert.equal(leadFor(s, "dragon"), 30);
});

test("un objectif peut avoir son propre delai", () => {
  const s = defaultSettings();
  s.objectives.baron.lead = 60;
  assert.equal(leadFor(s, "baron"), 60);
  assert.equal(leadFor(s, "dragon"), 30, "les autres suivent le reglage global");
});

test("un objectif desactive ne previent plus", () => {
  const s = defaultSettings();
  s.objectives.grubs.enabled = false;
  assert.equal(leadFor(s, "grubs"), 0);
});

test("le delai est borne, meme si le fichier dit n'importe quoi", () => {
  assert.equal(normalise({ leadSeconds: 9999 }).leadSeconds, LEAD_MAX);
  assert.equal(normalise({ leadSeconds: -40 }).leadSeconds, LEAD_MIN);
  assert.equal(normalise({ leadSeconds: "quarante" }).leadSeconds, 30, "retombe sur le defaut");
});

test("un fichier abime ne casse pas le demarrage", () => {
  for (const bad of [null, undefined, 42, "texte", [], { objectives: "non" }]) {
    const s = normalise(bad);
    assert.equal(s.leadSeconds, 30);
    assert.equal(Object.keys(s.objectives).length >= 5, true);
  }
});

test("un reglage enregistre est bien relu", () => {
  const s = defaultSettings();
  s.leadSeconds = 45;
  s.lang = "en";
  s.showList = false;
  s.objectives.baron.lead = 60;
  s.objectives.grubs.enabled = false;
  const back = normalise(JSON.parse(JSON.stringify(s)));
  assert.equal(back.leadSeconds, 45);
  assert.equal(back.lang, "en");
  assert.equal(back.showList, false);
  assert.equal(back.objectives.baron.lead, 60);
  assert.equal(back.objectives.grubs.enabled, false);
});

test("le delai choisi change vraiment le moment de l'alerte", () => {
  const s = defaultSettings();
  s.leadSeconds = 10;
  const seen = new Set<string>();
  /* le drake arrive a 5:00 ; a 25 s il est trop tot pour un reglage a 10 s */
  assert.equal(dueAlerts(objectiveStates(300 - 25, []), id => leadFor(s, id), seen).length, 0);
  assert.equal(dueAlerts(objectiveStates(300 - 8, []), id => leadFor(s, id), seen).length, 1);
});

test("chaque objectif part a son propre moment", () => {
  const s = defaultSettings();
  s.leadSeconds = 15;
  s.objectives.baron.lead = 60;
  const seen = new Set<string>();
  const lead = (id: Parameters<typeof leadFor>[1]) => leadFor(s, id);

  /* a 19:10, le baron arrive dans 50 s : dans sa fenetre de 60 s */
  const a = dueAlerts(objectiveStates(19 * 60 + 10, []), lead, seen);
  assert.deepEqual(a.map(x => x.id), ["baron"]);

  /* le drake, lui, attend ses 15 s */
  const ev: GameEvent[] = [{ EventName: "DragonKill", EventTime: 1000, DragonType: "Fire" }];
  assert.equal(dueAlerts(objectiveStates(1300 - 40, ev), lead, seen).length, 0);
  assert.equal(dueAlerts(objectiveStates(1300 - 12, ev), lead, seen).length, 1);
});

test("un objectif coupe ne declenche rien, meme a l'heure", () => {
  const s = defaultSettings();
  s.objectives.dragon.enabled = false;
  const seen = new Set<string>();
  assert.equal(dueAlerts(objectiveStates(295, []), id => leadFor(s, id), seen).length, 0);
});
