/* A fake League, so the overlay can be watched without playing.
 *
 * Serves the same shape as the game's own API on a different port, with the
 * clock running fast. Kills happen on a script, so every alert the overlay
 * can raise shows up within a couple of minutes.
 *
 *   npm run build && node dist/tools/mock-game.js
 *   OVERLAY_PORT=2998 npm start      (in another terminal)
 */

import { createServer } from "node:http";
import type { GameEvent } from "../src/shared/objectives.js";

const PORT = Number(process.env.MOCK_PORT ?? 2998);
const SPEED = Number(process.env.MOCK_SPEED ?? 20);   /* game seconds per real second */
const START = Number(process.env.MOCK_START ?? 240);  /* begin just before the first drake */

const lvl = () => Math.min(18, 1 + Math.floor(clockForLevels() / 90));
const players = [
  { summonerName: "Bleu1",  riotIdGameName: "Bleu1",  championName: "Udyr",   team: "ORDER", scores: { creepScore: 50 } },
  { summonerName: "Bleu2",  riotIdGameName: "Bleu2",  championName: "Kayle",  team: "ORDER", scores: { creepScore: 44 } },
  { summonerName: "Rouge1", riotIdGameName: "Rouge1", championName: "Ekko",   team: "CHAOS", scores: { creepScore: 61 } },
  { summonerName: "Rouge2", riotIdGameName: "Rouge2", championName: "Thresh", team: "CHAOS", scores: { creepScore: 12 } }
];

/* a plausible game: blue takes four drakes, both trade barons */
const script: GameEvent[] = [
  { EventID: 1, EventName: "GameStart",  EventTime: 0 },
  { EventID: 2, EventName: "DragonKill", EventTime: 330,  KillerName: "Bleu1",  DragonType: "Infernal" },
  { EventID: 3, EventName: "HordeKill",  EventTime: 500,  KillerName: "Rouge1" },
  { EventID: 4, EventName: "DragonKill", EventTime: 680,  KillerName: "Bleu1",  DragonType: "Cloud" },
  { EventID: 5, EventName: "HeraldKill", EventTime: 940,  KillerName: "Bleu2" },
  { EventID: 6, EventName: "DragonKill", EventTime: 1010, KillerName: "Bleu1",  DragonType: "Mountain" },
  { EventID: 7, EventName: "BaronKill",  EventTime: 1260, KillerName: "Rouge1" },
  { EventID: 8, EventName: "DragonKill", EventTime: 1340, KillerName: "Bleu1",  DragonType: "Ocean" },
  { EventID: 9, EventName: "DragonKill", EventTime: 1760, KillerName: "Bleu2",  DragonType: "Elder" }
];

const begunAt = Date.now();
const clock = () => START + ((Date.now() - begunAt) / 1000) * SPEED;
function clockForLevels(){ return clock(); }

function body(): string {
  const t = clock();
  return JSON.stringify({
    activePlayer: { riotId: "Bleu1", summonerName: "Bleu1", level: Math.min(18, 1 + Math.floor(t / 90)) },
    allPlayers: players.map(p => ({ ...p, level: lvl() })),
    events: { Events: script.filter(e => e.EventTime <= t) },
    gameData: { gameMode: "CLASSIC", gameTime: t, mapName: "Map11" }
  });
}

/* plain HTTP: the overlay relaxes certificate checks on loopback anyway,
   and a self-signed certificate would only add noise to a test tool */
/* a published build, exactly the shape the site's leaderboard returns,
   with the levelling order the real one does not carry yet */
const published = [{
  id: "faux-1", champion: "udyr", author: "Ylfik", name: "AD BRUISER",
  patch: "26.17", likes: 7, role: "jungle", rank: "Emerald", notes: null,
  data: {
    level: 18, q: 6, w: 6, e: 1, r: 5,
    order: ["q","w","e","q","q","r","q","w","q","w","r","w","w","r","r","r","q","w"],
    items: [{ name: "ECLIPSE" }, { name: "SUNDERED SKY" }, { name: null }],
    runes: [], shards: []
  }
}];

const srv = createServer((req, res) => {
  if (!req.url) { res.writeHead(404).end("non"); return; }

  if (req.url.startsWith("/rest/v1/leaderboard")) {
    const want = /champion=eq\.([a-z0-9]+)/.exec(req.url);
    const rows = want ? published.filter(b => b.champion === want[1]) : published;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(rows));
    return;
  }
  if (!req.url.startsWith("/liveclientdata")) { res.writeHead(404).end("non"); return; }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(body());
});

srv.listen(PORT, "127.0.0.1", () => {
  const t = clock();
  console.log(`fausse partie sur http://127.0.0.1:${PORT}`);
  console.log(`horloge a ${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}, x${SPEED}`);
  console.log(`lancer l'overlay avec :  OVERLAY_PORT=${PORT} OVERLAY_SCHEME=http npm start`);
});

/* so the tool can be stopped cleanly from a script */
process.on("SIGINT", () => { srv.close(); process.exit(0); });
