/* La liaison avec le site : choisir un build, et savoir quoi monter. */

import test from "node:test";
import assert from "node:assert/strict";
import {
  championKey, nextSkill, ranksAt, orderSummary, pickBuild, hasOrder, itemNames,
  type PublishedBuild, type SkillKey
} from "../src/shared/builds.js";


/* un ordre realiste : Q max, R des que possible */
const order: SkillKey[] =
  ["q","w","e","q","q","r","q","w","q","w","r","w","w","e","e","r","e","e"];

const build = (over: Partial<PublishedBuild> = {}): PublishedBuild => ({
  id: "1", champion: "udyr", author: "Ylfik", name: "AD BRUISER",
  patch: "26.15", likes: 1,
  data: { level: 18, order, items: [{ name: "ECLIPSE" }, { name: null }, { name: "SUNDERED SKY" }] },
  ...over
});

test("le nom du jeu devient la clef du site", () => {
  assert.equal(championKey("Cho'Gath"), "chogath");
  assert.equal(championKey("Tahm Kench"), "tahmkench");
  assert.equal(championKey("Xin Zhao"), "xinzhao");
  assert.equal(championKey("Aurelion Sol"), "aurelionsol");
  assert.equal(championKey("Udyr"), "udyr");
});

test("la prochaine montee suit le niveau", () => {
  assert.equal(nextSkill(order, 0), "q", "avant le premier niveau");
  assert.equal(nextSkill(order, 1), "w", "au niveau 1, la suivante est la deuxieme");
  assert.equal(nextSkill(order, 5), "r", "le R arrive au niveau 6");
  assert.equal(nextSkill(order, 17), "e");
  assert.equal(nextSkill(order, 18), null, "plus rien a monter");
});

test("sans ordre, on ne devine pas", () => {
  assert.equal(nextSkill(undefined, 5), null);
  assert.equal(nextSkill([], 5), null);
  assert.equal(hasOrder(build({ data: { items: [] } })), false);
  assert.equal(hasOrder(build()), true);
});

test("les rangs attendus a un niveau donne", () => {
  assert.deepEqual(ranksAt(order, 6), { q: 3, w: 1, e: 1, r: 1 });
  assert.deepEqual(ranksAt(order, 18), { q: 5, w: 5, e: 5, r: 3 });
});

test("le resume se lit comme les joueurs le disent", () => {
  assert.equal(orderSummary(order), "Q>W>E");
  assert.equal(orderSummary(undefined), "");
});

test("on choisit le build le plus aime du bon champion", () => {
  const list = [
    build({ id: "a", likes: 2 }),
    build({ id: "b", likes: 9 }),
    build({ id: "c", likes: 9 }),
    build({ id: "z", champion: "ekko", likes: 50 })
  ];
  const got = pickBuild(list, "Udyr");
  assert.equal(got && got.likes, 9);
  assert.equal(got && got.champion, "udyr", "pas celui d'Ekko");
});

test("le choix de l'utilisateur prime", () => {
  const list = [build({ id: "a", likes: 2 }), build({ id: "b", likes: 9 })];
  assert.equal(pickBuild(list, "Udyr", "a")?.id, "a");
});

test("un choix devenu introuvable retombe sur le plus aime", () => {
  const list = [build({ id: "a", likes: 2 }), build({ id: "b", likes: 9 })];
  assert.equal(pickBuild(list, "Udyr", "disparu")?.id, "b");
});

test("aucun build pour ce champion : rien, pas une erreur", () => {
  assert.equal(pickBuild([build()], "Yasuo"), null);
  assert.equal(pickBuild([], "Udyr"), null);
});

test("le choix est stable entre deux lectures", () => {
  const list = [build({ id: "a", likes: 9 }), build({ id: "b", likes: 9 })];
  assert.equal(pickBuild(list, "Udyr")?.id, pickBuild(list.slice().reverse(), "Udyr")?.id);
});

test("les emplacements vides ne comptent pas comme objets", () => {
  assert.deepEqual(itemNames(build()), ["ECLIPSE", "SUNDERED SKY"]);
});

test("un build publie avant l'ordre de montee ne casse rien", () => {
  const vieux = build({ data: { level: 18, q: 5, w: 5, e: 5, r: 3, items: [] } });
  assert.equal(hasOrder(vieux), false);
  assert.equal(nextSkill(vieux.data.order, 5), null);
});
