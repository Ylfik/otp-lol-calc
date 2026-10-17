/* La conversion vers une page de runes : une erreur ici produit une page
   que le client refuse en silence, ou pire, accepte de travers. */

import test from "node:test";
import assert from "node:assert/strict";
import {
  toRunePage, treeLookup, pageLooksValid, RuneError,
  STYLE_IDS, SHARD_IDS
} from "../src/shared/runes.js";

/* un extrait fidele de runesReforged : deux arbres suffisent a tester */
const reforged = [
  { id: 8000, key: "Precision", slots: [
    { runes: [{ id: 8005 }, { id: 8008 }, { id: 8010 }] },
    { runes: [{ id: 9101 }, { id: 9111 }] },
    { runes: [{ id: 9104 }, { id: 9105 }] },
    { runes: [{ id: 8014 }, { id: 8017 }] }
  ]},
  { id: 8200, key: "Sorcery", slots: [
    { runes: [{ id: 8214 }, { id: 8229 }] },
    { runes: [{ id: 8226 }, { id: 8275 }] }
  ]},
  { id: 8400, key: "Resolve", slots: [
    { runes: [{ id: 8437 }, { id: 8439 }] }
  ]}
];
const treeOf = treeLookup(reforged);

const runes = (ids: number[]) => ids.map(id => ({ id }));

test("les identifiants d'arbres sont ceux de Riot", () => {
  assert.equal(STYLE_IDS.Precision, 8000);
  assert.equal(STYLE_IDS.Domination, 8100);
  assert.equal(STYLE_IDS.Sorcery, 8200);
  assert.equal(STYLE_IDS.Inspiration, 8300);
  assert.equal(STYLE_IDS.Resolve, 8400);
});

test("les fragments portent les identifiants du jeu", () => {
  assert.equal(SHARD_IDS.adaptive, 5008);
  assert.equal(SHARD_IDS.as, 5005);
  assert.equal(SHARD_IDS.ah, 5007);
  assert.equal(SHARD_IDS.ms, 5010);
  assert.equal(SHARD_IDS.hpScale, 5001);
  assert.equal(SHARD_IDS.hp65, 5011);
  assert.equal(SHARD_IDS.ten, 5013);
});

test("une page complete se construit dans le bon ordre", () => {
  const p = toRunePage("AD BRUISER",
    runes([8010, 9111, 9104, 8014, 8226, 8275]), [0, 0, 1], treeOf);
  assert.equal(p.primaryStyleId, 8000);
  assert.equal(p.subStyleId, 8200);
  assert.deepEqual(p.selectedPerkIds,
    [8010, 9111, 9104, 8014,   /* quatre de l'arbre principal */
     8226, 8275,               /* deux du secondaire */
     5008, 5008, 5013]);       /* les trois fragments */
  assert.equal(p.current, true);
  assert.equal(pageLooksValid(p), true);
});

test("l'ordre d'enregistrement n'a pas d'importance", () => {
  /* les runes sont triees par arbre, pas par position dans la liste */
  const melange = toRunePage("x",
    runes([8010, 8226, 9111, 8275, 9104, 8014]), [1, 1, 0], treeOf);
  assert.equal(melange.primaryStyleId, 8000);
  assert.equal(melange.subStyleId, 8200);
  assert.deepEqual(melange.selectedPerkIds.slice(0, 4), [8010, 9111, 9104, 8014]);
  assert.deepEqual(melange.selectedPerkIds.slice(4, 6), [8226, 8275]);
});

test("les fragments suivent la ligne ou ils sont choisis", () => {
  const p = toRunePage("x", runes([8010, 9111, 9104, 8014, 8226, 8275]), [1, 2, 2], treeOf);
  assert.deepEqual(p.selectedPerkIds.slice(6), [5005, 5001, 5001]);
});

test("un build sans ses six runes est refuse", () => {
  assert.throws(() => toRunePage("x", runes([8010, 9111]), [0, 0, 0], treeOf), RuneError);
  assert.throws(() => toRunePage("x", [], [0, 0, 0], treeOf), RuneError);
  assert.throws(() => toRunePage("x", undefined, [0, 0, 0], treeOf), RuneError);
});

test("un fragment manquant est refuse plutot que devine", () => {
  const r = runes([8010, 9111, 9104, 8014, 8226, 8275]);
  assert.throws(() => toRunePage("x", r, [0, null, 0], treeOf), RuneError);
  assert.throws(() => toRunePage("x", r, [0, 0], treeOf), RuneError);
});

test("un repartition impossible est refusee", () => {
  /* trois runes dans le secondaire : le client refuserait la page */
  assert.throws(
    () => toRunePage("x", runes([8010, 9111, 9104, 8226, 8275, 8214]), [0, 0, 0], treeOf),
    RuneError);
  /* tout dans le meme arbre */
  assert.throws(
    () => toRunePage("x", runes([8010, 9111, 9104, 8014, 8017, 8005]), [0, 0, 0], treeOf),
    RuneError);
});

test("une rune inconnue est refusee", () => {
  assert.throws(
    () => toRunePage("x", runes([8010, 9111, 9104, 8014, 8226, 999999]), [0, 0, 0], treeOf),
    RuneError);
});

test("un nom trop long est raccourci, pas rejete", () => {
  const p = toRunePage("n".repeat(120), runes([8010, 9111, 9104, 8014, 8226, 8275]), [0, 0, 0], treeOf);
  assert.equal(p.name.length, 50);
});

test("le controle final attrape une page bancale", () => {
  const bon = toRunePage("x", runes([8010, 9111, 9104, 8014, 8226, 8275]), [0, 0, 0], treeOf);
  assert.equal(pageLooksValid(bon), true);
  assert.equal(pageLooksValid({ ...bon, selectedPerkIds: bon.selectedPerkIds.slice(0, 8) }), false);
  assert.equal(pageLooksValid({ ...bon, subStyleId: bon.primaryStyleId }), false);
});

test("le troisieme arbre est reconnu aussi", () => {
  const p = toRunePage("x", runes([8010, 9111, 9104, 8014, 8437, 8439]), [0, 0, 0], treeOf);
  assert.equal(p.subStyleId, 8400);
});
