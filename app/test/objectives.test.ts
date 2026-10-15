/* The timer is the whole point of the app, so it is tested on its own,
   without Electron and without League. Run with: npm test */

import test from "node:test";
import assert from "node:assert/strict";
import {
  objectiveStates, dueAlerts, mmss, OBJECTIVES,
  type GameEvent, type Side
} from "../src/shared/objectives.js";

const at = (id: string, states: ReturnType<typeof objectiveStates>) =>
  states.find(s => s.id === id)!;

const sides: Record<string, Side> = { Bleu: "ORDER", Rouge: "CHAOS" };
const teamOf = (n: string) => sides[n];

test("le premier drake est annonce a 5:00", () => {
  const s = objectiveStates(4 * 60, [], teamOf);
  assert.equal(at("dragon", s).spawnAt, 300);
  assert.equal(at("dragon", s).status, "soon");
  assert.equal(at("dragon", s).inSeconds, 60);
});

test("un drake tue replanifie cinq minutes plus tard", () => {
  const ev: GameEvent[] = [{ EventName: "DragonKill", EventTime: 320, KillerName: "Bleu", DragonType: "Fire" }];
  const s = objectiveStates(400, ev, teamOf);
  assert.equal(at("dragon", s).spawnAt, 320 + 300);
  assert.equal(at("dragon", s).inSeconds, 220);
});

test("les larves apparaissent a 8:00 et disparaissent a 14:45", () => {
  assert.equal(at("grubs", objectiveStates(7 * 60, [], teamOf)).spawnAt, 480);
  assert.equal(at("grubs", objectiveStates(8 * 60 + 5, [], teamOf)).status, "up");
  assert.equal(at("grubs", objectiveStates(14 * 60 + 50, [], teamOf)).status, "gone");
});

test("les larves ne reviennent pas une fois tuees", () => {
  const ev: GameEvent[] = [{ EventName: "HordeKill", EventTime: 500 }];
  assert.equal(at("grubs", objectiveStates(600, ev, teamOf)).status, "gone");
});

test("le heraut apparait a 15:00 et laisse la place au baron", () => {
  assert.equal(at("herald", objectiveStates(14 * 60, [], teamOf)).spawnAt, 900);
  assert.equal(at("herald", objectiveStates(19 * 60 + 50, [], teamOf)).status, "gone");
  assert.equal(at("baron", objectiveStates(19 * 60, [], teamOf)).spawnAt, 1200);
});

test("le baron revient six minutes apres sa mort", () => {
  const ev: GameEvent[] = [{ EventName: "BaronKill", EventTime: 1250, KillerName: "Rouge" }];
  const s = objectiveStates(1300, ev, teamOf);
  assert.equal(at("baron", s).spawnAt, 1250 + 360);
  assert.equal(at("baron", s).inSeconds, 310);
});

test("l'ancien remplace le drake au quatrieme drake d'une equipe", () => {
  const four: GameEvent[] = [320, 650, 980, 1310].map((t, i) => ({
    EventName: "DragonKill", EventTime: t, KillerName: "Bleu", DragonType: ["Fire","Air","Earth","Water"][i]
  }));
  const s = objectiveStates(1400, four, teamOf);
  assert.equal(at("dragon", s).status, "gone", "le drake ne revient plus");
  assert.equal(at("elder", s).spawnAt, 1310 + 360);
});

test("quatre drakes partages entre les deux equipes ne declenchent pas l'ancien", () => {
  const split: GameEvent[] = [
    { EventName: "DragonKill", EventTime: 320,  KillerName: "Bleu",  DragonType: "Fire" },
    { EventName: "DragonKill", EventTime: 650,  KillerName: "Rouge", DragonType: "Air" },
    { EventName: "DragonKill", EventTime: 980,  KillerName: "Bleu",  DragonType: "Earth" },
    { EventName: "DragonKill", EventTime: 1310, KillerName: "Rouge", DragonType: "Water" }
  ];
  const s = objectiveStates(1400, split, teamOf);
  assert.equal(at("elder", s).status, "gone", "deux partout, pas d'ancien");
  assert.equal(at("dragon", s).spawnAt, 1310 + 300);
});

test("sans correspondance joueur-equipe, quatre drakes suffisent par prudence", () => {
  const four: GameEvent[] = [320, 650, 980, 1310].map(t => ({
    EventName: "DragonKill", EventTime: t, KillerName: "Inconnu", DragonType: "Fire"
  }));
  const s = objectiveStates(1400, four);     /* pas de teamOf */
  assert.equal(at("elder", s).spawnAt, 1310 + 360);
});

test("l'ancien tue revient six minutes plus tard", () => {
  const ev: GameEvent[] = [
    ...[320, 650, 980, 1310].map(t => ({ EventName: "DragonKill", EventTime: t, KillerName: "Bleu", DragonType: "Fire" })),
    { EventName: "DragonKill", EventTime: 1700, KillerName: "Bleu", DragonType: "Elder" }
  ];
  const s = objectiveStates(1800, ev, teamOf);
  assert.equal(at("elder", s).spawnAt, 1700 + 360);
});

test("une alerte ne part qu'une fois par apparition", () => {
  const seen = new Set<string>();
  const states = objectiveStates(300 - 25, [], teamOf);   /* drake dans 25 s */
  const first = dueAlerts(states, 30, seen);
  assert.equal(first.length, 1);
  assert.equal(first[0].id, "dragon");
  const again = dueAlerts(objectiveStates(300 - 20, [], teamOf), 30, seen);
  assert.equal(again.length, 0, "deja annonce");
});

test("aucune alerte avant le delai choisi", () => {
  const seen = new Set<string>();
  assert.equal(dueAlerts(objectiveStates(300 - 45, [], teamOf), 30, seen).length, 0);
});

test("une nouvelle apparition redeclenche une alerte", () => {
  const seen = new Set<string>();
  dueAlerts(objectiveStates(275, [], teamOf), 30, seen);
  const ev: GameEvent[] = [{ EventName: "DragonKill", EventTime: 310, KillerName: "Bleu", DragonType: "Fire" }];
  const later = dueAlerts(objectiveStates(310 + 300 - 10, ev, teamOf), 30, seen);
  assert.equal(later.length, 1, "le drake suivant est bien annonce");
});

test("Atakhan n'est pas dans la table", () => {
  assert.equal(OBJECTIVES.some(o => /atakhan/i.test(o.id)), false);
});

test("affichage minutes secondes", () => {
  assert.equal(mmss(0), "0:00");
  assert.equal(mmss(65), "1:05");
  assert.equal(mmss(600), "10:00");
});
