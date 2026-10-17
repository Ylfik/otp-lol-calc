/* A fake League *client* — the other half of mock-game.
 *
 * mock-game pretends a match is running; this one pretends the client is
 * open and a draft is on. It answers the four endpoints the overlay uses,
 * writes a lockfile for it to find, and — because this container cannot
 * reach Riot's servers — also stands in for Data Dragon.
 *
 * Everything the overlay sends back (the rune page, the item set) is kept
 * and written out, so a test can check what the client would have been
 * given rather than only that the call succeeded.
 *
 *   node dist/tools/mock-client.js
 *   OVERLAY_LOCKFILE=/tmp/lockfile OVERLAY_DDRAGON=http://127.0.0.1:2997 npm start
 */

import { createServer } from "node:http";
import { writeFileSync } from "node:fs";

const PORT = Number(process.env.MOCK_CLIENT_PORT ?? 2997);
const LOCKFILE = process.env.MOCK_LOCKFILE ?? "/tmp/lol-mock-lockfile";
const RECORD = process.env.MOCK_RECORD ?? "/tmp/lol-mock-record.json";
const PASSWORD = "mot-de-passe-factice";
const SUMMONER = 1234567;

/* Udyr: the champion the site has a published build for */
const CHAMP_ID = 77;

/* champion select starts a few seconds in, so the "waiting" state is
   visible first and the switch can be watched */
const DRAFT_AT = Number(process.env.MOCK_DRAFT_AT ?? 3) * 1000;
const PICK_AT = Number(process.env.MOCK_PICK_AT ?? 6) * 1000;
const begun = Date.now();
const since = () => Date.now() - begun;

/* what the overlay sent us */
const record: { runePages: unknown[]; deleted: string[]; itemSets: unknown[] } =
  { runePages: [], deleted: [], itemSets: [] };
let pages: any[] = [
  /* one page the player made by hand: it must survive the import */
  { id: 1, name: "Ma page à moi", isDeletable: true, current: true }
];
let sets: any = { accountId: SUMMONER, itemSets: [] };

const save = () => { try { writeFileSync(RECORD, JSON.stringify(record, null, 2)); } catch { /* best effort */ } };

/* ---- the Data Dragon slices the overlay actually reads --------------- */

const VERSION = "26.17.1";
const champions = { data: { Udyr: { id: "Udyr", key: String(CHAMP_ID) } } };
const runesReforged = [
  { id: 8000, key: "Precision", slots: [
    { runes: [{ id: 8005 }, { id: 8008 }, { id: 8010 }, { id: 8021 }] },
    { runes: [{ id: 9101 }, { id: 9111 }, { id: 8009 }] },
    { runes: [{ id: 9104 }, { id: 9105 }, { id: 9103 }] },
    { runes: [{ id: 8014 }, { id: 8017 }, { id: 8299 }] }
  ]},
  { id: 8400, key: "Resolve", slots: [
    { runes: [{ id: 8437 }, { id: 8439 }, { id: 8465 }] },
    { runes: [{ id: 8446 }, { id: 8463 }, { id: 8401 }] },
    { runes: [{ id: 8429 }, { id: 8444 }, { id: 8473 }] },
    { runes: [{ id: 8451 }, { id: 8453 }, { id: 8242 }] }
  ]}
];
const items = { data: {
  "6692": { name: "Eclipse" },
  "6610": { name: "Sundered Sky" },
  "3047": { name: "Plated Steelcaps" }
} };

/* ---- champion select ------------------------------------------------ */

function session() {
  const t = since();
  if (t < DRAFT_AT) return null;                 /* no draft yet: 404 */
  const picked = t >= PICK_AT ? CHAMP_ID : 0;
  return {
    localPlayerCellId: 2,
    myTeam: [
      { cellId: 0, championId: 0 },
      { cellId: 1, championId: 0 },
      { cellId: 2, championId: picked },
      { cellId: 3, championId: 0 },
      { cellId: 4, championId: 0 }
    ],
    actions: [[{ actorCellId: 2, type: "pick", championId: picked, completed: picked > 0 }]]
  };
}

/* ---- the server ----------------------------------------------------- */

function read(req: any): Promise<any> {
  return new Promise(resolve => {
    let b = "";
    req.on("data", (c: Buffer) => { b += c; });
    req.on("end", () => { try { resolve(b ? JSON.parse(b) : null); } catch { resolve(null); } });
  });
}

const srv = createServer(async (req, res) => {
  const url = req.url || "";
  const method = req.method || "GET";
  const json = (code: number, body: unknown) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  /* the client refuses anything unauthenticated, and so does this */
  if (url.startsWith("/lol-")) {
    const want = "Basic " + Buffer.from("riot:" + PASSWORD).toString("base64");
    if (req.headers.authorization !== want) { json(401, { message: "unauthorized" }); return; }
  }

  if (url.startsWith("/lol-champ-select/v1/session")) {
    const s = session();
    if (!s) { json(404, { httpStatus: 404 }); return; }
    json(200, s); return;
  }
  if (url.startsWith("/lol-summoner/v1/current-summoner")) {
    json(200, { summonerId: SUMMONER, displayName: "Ylfik" }); return;
  }
  if (url.startsWith("/lol-perks/v1/pages")) {
    if (method === "GET") { json(200, pages); return; }
    if (method === "POST") {
      const page = await read(req);
      record.runePages.push(page); save();
      pages = pages.concat([{ ...page, id: 100 + pages.length, isDeletable: true }]);
      json(200, page); return;
    }
    if (method === "DELETE") {
      const id = Number(url.split("/").pop());
      const gone = pages.find(p => p.id === id);
      if (gone) { record.deleted.push(gone.name); save(); }
      pages = pages.filter(p => p.id !== id);
      json(204, null); return;
    }
  }
  if (/^\/lol-item-sets\/v1\/item-sets\/\d+\/sets/.test(url)) {
    if (method === "GET") { json(200, sets); return; }
    if (method === "PUT") {
      sets = await read(req);
      record.itemSets.push(sets); save();
      json(201, sets); return;
    }
  }

  /* Data Dragon, for a container with no way out */
  if (url === "/api/versions.json") { json(200, [VERSION]); return; }
  if (url.endsWith("/champion.json")) { json(200, champions); return; }
  if (url.endsWith("/runesReforged.json")) { json(200, runesReforged); return; }
  if (url.endsWith("/item.json")) { json(200, items); return; }

  json(404, { message: "non" });
});

srv.listen(PORT, "127.0.0.1", () => {
  writeFileSync(LOCKFILE, `LeagueClient:4242:${PORT}:${PASSWORD}:http`);
  save();
  console.log(`faux client sur http://127.0.0.1:${PORT}`);
  console.log(`lockfile : ${LOCKFILE}`);
  console.log(`draft a ${DRAFT_AT / 1000}s, pick (Udyr) a ${PICK_AT / 1000}s`);
  console.log(`lancer :  OVERLAY_LOCKFILE=${LOCKFILE} OVERLAY_DDRAGON=http://127.0.0.1:${PORT} npm start`);
});

process.on("SIGINT", () => { srv.close(); process.exit(0); });
