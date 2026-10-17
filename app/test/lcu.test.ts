/* Le client League : lire son lockfile, lire la draft, traduire les noms
   d'objets. Une erreur ici ne casse rien visiblement — elle envoie
   simplement une mauvaise page de runes, ou rien du tout. */

import test from "node:test";
import assert from "node:assert/strict";
import { createServer, Server } from "node:http";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseLockfile, findLockfile, champSelect, summonerId, request } from "../src/main/lcu.js";
import { normalise } from "../src/main/items.js";

/* ---- le lockfile ---------------------------------------------------- */

test("le lockfile du client est lu tel qu'il l'ecrit", () => {
  const l = parseLockfile("LeagueClient:21884:54321:AbCdEf:https");
  assert.deepEqual(l, { port: 54321, password: "AbCdEf", protocol: "https" });
});

test("un lockfile tronque ou vide ne passe pas pour valide", () => {
  assert.equal(parseLockfile(""), null);
  assert.equal(parseLockfile("LeagueClient:21884:54321"), null);
  assert.equal(parseLockfile("LeagueClient:21884:pasunport:x:https"), null);
  assert.equal(parseLockfile("LeagueClient:21884:54321::https"), null);
});

test("le protocole http est respecte quand le client l'annonce", () => {
  assert.equal(parseLockfile("x:1:2:p:http")?.protocol, "http");
  /* tout le reste est traite comme du https, jamais devine */
  assert.equal(parseLockfile("x:1:2:p:bizarre")?.protocol, "https");
});

test("le chemin donne par l'environnement passe avant les chemins connus", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lock-"));
  const file = path.join(dir, "lockfile");
  writeFileSync(file, "LeagueClient:9:7777:secret:http");
  const before = process.env.OVERLAY_LOCKFILE;
  process.env.OVERLAY_LOCKFILE = file;
  try {
    assert.deepEqual(findLockfile(), { port: 7777, password: "secret", protocol: "http" });
  } finally {
    if (before === undefined) delete process.env.OVERLAY_LOCKFILE;
    else process.env.OVERLAY_LOCKFILE = before;
  }
});

test("aucun client ouvert : rien, et pas une erreur", () => {
  const before = process.env.OVERLAY_LOCKFILE;
  process.env.OVERLAY_LOCKFILE = path.join(tmpdir(), "ce-fichier-n-existe-pas-" + Date.now());
  try { assert.equal(findLockfile(), null); }
  finally {
    if (before === undefined) delete process.env.OVERLAY_LOCKFILE;
    else process.env.OVERLAY_LOCKFILE = before;
  }
});

/* ---- la draft, contre un faux client -------------------------------- */

const PASSWORD = "mdp";
let reply: { status: number; body: unknown } = { status: 404, body: null };
let lastAuth = "";
let srv: Server;
let lock: { port: number; password: string; protocol: "http" };

test.before(async () => {
  srv = createServer((req, res) => {
    lastAuth = String(req.headers.authorization || "");
    if (req.url?.startsWith("/lol-summoner")) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ summonerId: 4242 }));
      return;
    }
    res.writeHead(reply.status, { "content-type": "application/json" });
    res.end(reply.body === null ? "" : JSON.stringify(reply.body));
  });
  await new Promise<void>(r => srv.listen(0, "127.0.0.1", r));
  lock = { port: (srv.address() as any).port, password: PASSWORD, protocol: "http" };
});
test.after(() => srv.close());

test("la requete s'authentifie comme le client l'attend", async () => {
  reply = { status: 200, body: { ok: true } };
  await request(lock, "GET", "/lol-test");
  assert.equal(lastAuth, "Basic " + Buffer.from("riot:" + PASSWORD).toString("base64"));
});

test("pas de draft en cours : le client repond 404", async () => {
  reply = { status: 404, body: { httpStatus: 404 } };
  assert.deepEqual(await champSelect(lock), { active: false, championId: 0, locked: false });
});

test("un champion survole est deja propose, avant le verrouillage", async () => {
  reply = { status: 200, body: {
    localPlayerCellId: 2,
    myTeam: [{ cellId: 2, championId: 0 }],
    actions: [[{ actorCellId: 2, type: "pick", championId: 77, completed: false }]]
  }};
  assert.deepEqual(await champSelect(lock), { active: true, championId: 77, locked: false });
});

test("le champion verrouille est celui de l'equipe", async () => {
  reply = { status: 200, body: {
    localPlayerCellId: 2,
    myTeam: [{ cellId: 1, championId: 99 }, { cellId: 2, championId: 77 }],
    actions: [[{ actorCellId: 2, type: "pick", championId: 77, completed: true }]]
  }};
  const cs = await champSelect(lock);
  assert.equal(cs.championId, 77);
  assert.equal(cs.locked, true);
});

test("le choix d'un coequipier n'est pas pris pour le notre", async () => {
  reply = { status: 200, body: {
    localPlayerCellId: 2,
    myTeam: [{ cellId: 2, championId: 0 }],
    actions: [[{ actorCellId: 4, type: "pick", championId: 266, completed: true }]]
  }};
  assert.deepEqual(await champSelect(lock), { active: true, championId: 0, locked: false });
});

test("un bannissement n'est pas un choix de champion", async () => {
  reply = { status: 200, body: {
    localPlayerCellId: 2,
    myTeam: [{ cellId: 2, championId: 0 }],
    actions: [[{ actorCellId: 2, type: "ban", championId: 157, completed: true }]]
  }};
  assert.equal((await champSelect(lock)).championId, 0);
});

test("une reponse incomprehensible ne devient pas une fausse draft", async () => {
  reply = { status: 200, body: { quelqueChose: "d'autre" } };
  assert.deepEqual(await champSelect(lock), { active: false, championId: 0, locked: false });
});

test("l'identifiant d'invocateur est lu", async () => {
  assert.equal(await summonerId(lock), 4242);
});

/* ---- les noms d'objets ---------------------------------------------- */

test("les noms du site et ceux de Riot se rejoignent", () => {
  /* le site les enregistre en majuscules, Riot les ecrit normalement */
  assert.equal(normalise("ECLIPSE"), normalise("Eclipse"));
  assert.equal(normalise("SUNDERED SKY"), normalise("Sundered Sky"));
  assert.equal(normalise("LUDEN'S ECHO"), normalise("Luden's Echo"));
  assert.equal(normalise("JAK'SHO, THE PROTEAN"), normalise("Jak'Sho, The Protean"));
  assert.notEqual(normalise("Boots"), normalise("Boots of Swiftness"));
});
