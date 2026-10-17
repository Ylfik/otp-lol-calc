/* The draft, end to end, with nothing real involved.
 *
 * Starts the fake site, the fake League client and the app itself under a
 * virtual screen, then drives the hub the way a player would: wait for the
 * pick to appear, choose a build, press Importer. What the fake client was
 * sent is read back and checked — a green button proves nothing on its own.
 *
 *   xvfb-run -a node tools/draft-demo.mjs
 */

import { spawn } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE_PORT = 2998, CLIENT_PORT = 2997, CDP_PORT = 9222;
const LOCKFILE = "/tmp/lol-mock-lockfile";
const RECORD = "/tmp/lol-mock-record.json";
const SHOTS = process.env.SHOT_DIR || "/tmp/draft-shots";

for (const f of [LOCKFILE, RECORD]) if (existsSync(f)) rmSync(f);

const kids = [];
const stopAll = () => kids.forEach(k => { try { k.kill("SIGKILL"); } catch {} });
process.on("exit", stopAll);

const wait = ms => new Promise(r => setTimeout(r, ms));
const say = s => console.log("  " + s);

function start(name, script, env) {
  const k = spawn(process.execPath, [path.join(root, script)],
    { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  k.stdout.on("data", d => process.stdout.write(`  [${name}] ` + d));
  k.stderr.on("data", d => process.stderr.write(`  [${name}!] ` + d));
  kids.push(k);
  return k;
}

/* ---- the two fakes -------------------------------------------------- */

start("site", "dist/tools/mock-game.js", { MOCK_PORT: String(SITE_PORT) });
start("client", "dist/tools/mock-client.js", {
  MOCK_CLIENT_PORT: String(CLIENT_PORT), MOCK_LOCKFILE: LOCKFILE, MOCK_RECORD: RECORD,
  MOCK_DRAFT_AT: "4", MOCK_PICK_AT: "8"
});
await wait(900);

/* ---- the app -------------------------------------------------------- */

const electron = path.join(root, "node_modules", "electron", "dist", "electron");
const app = spawn(electron, [".", `--remote-debugging-port=${CDP_PORT}`, "--no-sandbox"], {
  cwd: root,
  env: {
    ...process.env,
    OVERLAY_LOCKFILE: LOCKFILE,
    OVERLAY_DDRAGON: `http://127.0.0.1:${CLIENT_PORT}`,
    OVERLAY_SITE: `http://127.0.0.1:${SITE_PORT}`,
    OVERLAY_PORT: "2996",                     /* personne n'ecoute : pas de partie */
    OVERLAY_SCHEME: "http"
  },
  stdio: ["ignore", "pipe", "pipe"]
});
kids.push(app);
app.stdout.on("data", d => process.stdout.write("  [app] " + d));
app.stderr.on("data", d => { const s = String(d); if (!/GPU|dbus|gbm|Vulkan|sandbox/i.test(s)) process.stderr.write("  [app!] " + s); });

/* ---- a small CDP client, enough to read and press ------------------- */

async function hubTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const t = list.find(x => x.type === "page" && /hub\.html/.test(x.url));
      if (t) return t;
    } catch { /* not up yet */ }
    await wait(500);
  }
  throw new Error("fenetre hub introuvable");
}

const t = await hubTarget();
say("hub ouvert : " + t.title);
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("CDP refuse")); });

let id = 0;
const pending = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function evaluate(expr) {
  const n = ++id;
  return new Promise((ok, no) => {
    pending.set(n, m => {
      if (m.error) { no(new Error(m.error.message)); return; }
      const r = m.result?.result;
      if (m.result?.exceptionDetails) { no(new Error(r?.description || "erreur page")); return; }
      ok(r?.value);
    });
    ws.send(JSON.stringify({ id: n, method: "Runtime.evaluate",
      params: { expression: expr, awaitPromise: true, returnByValue: true } }));
  });
}

const shot = async name => {
  if (!process.env.DISPLAY) return;
  await new Promise(r => spawn("import", ["-window", "root", path.join(SHOTS, name)],
    { stdio: "ignore" }).on("exit", r));
};
spawn("mkdir", ["-p", SHOTS]).on("exit", () => {});

const state = () => evaluate(`JSON.stringify({
  txt: document.getElementById("stateTxt").textContent,
  dot: document.getElementById("dot").className,
  draft: document.getElementById("draftBody").textContent.replace(/\\s+/g," ").trim().slice(0,160),
  builds: [...document.querySelectorAll("[data-pick]")].map(e => e.querySelector(".n").textContent),
  imp: !!document.getElementById("imp")
})`).then(JSON.parse);

/* ---- the run -------------------------------------------------------- */

let failed = [];
const check = (ok, what) => { say((ok ? "ok   " : "RATE ") + what); if (!ok) failed.push(what); };

await wait(1500);
let s = await state();
say(`avant la draft : « ${s.txt} » / « ${s.draft} »`);
check(/client/i.test(s.txt), "le hub voit le client avant toute partie");
check(s.dot.includes("warm"), "le voyant est orange (client, pas de partie)");
await shot("1-attente.png");

/* the fake client opens champion select at 4s and locks Udyr at 8s */
for (let i = 0; i < 30 && !(s.builds || []).length; i++) { await wait(700); s = await state(); }
say(`pendant la draft : « ${s.draft} »`);
check(s.builds.length > 0, "les builds du champion choisi apparaissent");
check(s.builds.includes("AD BRUISER"), "le build publie sur le site est propose");
check(s.imp, "le bouton Importer est la");
await shot("2-draft.png");

const out = await evaluate(`(async () => {
  document.getElementById("imp").click();
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 250));
    const r = document.getElementById("result");
    if (r && r.className) return r.className + " | " + r.textContent;
  }
  return "aucune reponse";
})()`);
say("retour du bouton : " + out);
check(out.startsWith("ok"), "l'import se declare reussi");
await shot("3-importe.png");

/* le hub se rafraichit plusieurs fois par seconde : le message doit tenir */
await wait(4000);
const still = await evaluate(`document.getElementById("result").textContent`);
check(/Import/.test(still), "le compte rendu survit aux rafraichissements : « " + still + " »");

/* ---- what the client was actually handed ---------------------------- */

await wait(400);
const rec = JSON.parse(readFileSync(RECORD, "utf8"));
const page = rec.runePages[0];
check(!!page, "une page de runes a ete envoyee au client");
if (page) {
  check(page.primaryStyleId === 8000 && page.subStyleId === 8400,
    `arbres : ${page.primaryStyleId}/${page.subStyleId} (attendu 8000/8400)`);
  check(JSON.stringify(page.selectedPerkIds) ===
        JSON.stringify([8010, 9111, 9104, 8014, 8446, 8473, 5008, 5008, 5013]),
    "les neuf runes sont dans l'ordre du client : " + JSON.stringify(page.selectedPerkIds));
  check(page.current === true, "la page est selectionnee");
  check(String(page.name).startsWith("OTP · "), "la page porte la marque de l'app");
}
check(!rec.deleted.includes("Ma page à moi"), "la page faite a la main n'est pas supprimee");

const set = rec.itemSets[0];
check(!!set, "un set d'objets a ete envoye");
if (set) {
  const ids = (set.itemSets?.[0]?.blocks?.[0]?.items || []).map(i => Number(i.id));
  check(JSON.stringify(ids) === JSON.stringify([6692, 6610]),
    "les objets du build sont traduits en numeros : " + JSON.stringify(ids));
  check((set.itemSets[0].associatedChampions || []).includes(77),
    "le set est rattache au champion de la draft");
}

/* a second import must not pile pages up */
await evaluate(`document.getElementById("imp").click()`);
await wait(2500);
const rec2 = JSON.parse(readFileSync(RECORD, "utf8"));
check(rec2.deleted.filter(n => n.startsWith("OTP · ")).length === 1,
  "le second import remplace sa propre page au lieu d'en ajouter une");

stopAll();
console.log(`\n  ${failed.length ? "ECHECS : " + failed.join(" ; ") : "tout est passe."}`);
console.log(`  captures dans ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
