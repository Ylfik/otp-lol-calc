/* La mise à jour automatique, de bout en bout, sans rien publier.
 *
 * Sert un faux dépôt annonçant une version plus récente, lance l'app
 * sous écran virtuel, et regarde la fenêtre principale passer par
 * « disponible », « téléchargement », « prête » — puis vérifie que le
 * bouton d'installation est apparu et que le fichier réellement
 * téléchargé est bien celui qui était annoncé, somme de contrôle
 * comprise. C'est electron-updater qui travaille : rien n'est simulé de
 * son côté, seul GitHub est remplacé.
 *
 * L'installation elle-même n'est pas jouée ici : elle remplacerait
 * l'application. Ce qui est vérifié, c'est tout ce qui la précède.
 *
 *   xvfb-run -a node tools/update-demo.mjs
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { writeFileSync, rmSync, existsSync, mkdtempSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
/* deux scenarios : "auto", la mise a jour complete ; "manual", une
   Release publiee a la main, sans les fichiers que l'app lit pour se
   remplacer — elle doit alors proposer le lien, pas une erreur. */
const MODE = process.env.DEMO_MODE === "manual" ? "manual" : "auto";
const FEED_PORT = 2995, CDP_PORT = 9223;
const NEW_VERSION = "9.9.9";
const DEV_CONFIG = path.join(root, "dev-app-update.yml");
const SHOTS = process.env.SHOT_DIR || "/tmp/update-shots";

const wait = ms => new Promise(r => setTimeout(r, ms));
const say = s => console.log("  " + s);
let failed = [];
const check = (ok, what) => { say((ok ? "ok   " : "RATE ") + what); if (!ok) failed.push(what); };

/* ---- le faux dépôt -------------------------------------------------- */

/* un "installeur" qui n'en est pas un : seule sa somme de contrôle
   compte pour ce que l'on vérifie ici */
const payload = randomBytes(12 * 1024 * 1024);
const sha512 = createHash("sha512").update(payload).digest("base64");
const FILE = `LoL-Overlay-${NEW_VERSION}-linux.AppImage`;

const yml = `version: ${NEW_VERSION}
files:
  - url: ${FILE}
    sha512: ${sha512}
    size: ${payload.length}
path: ${FILE}
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
`;

const served = [];
const feed = createServer((req, res) => {
  const u = (req.url || "").split("?")[0];
  served.push(u);
  if (u === "/latest-linux.yml") {
    if (MODE === "manual") { res.writeHead(404); res.end("pas de metadonnees"); return; }
    res.writeHead(200, { "content-type": "text/yaml" }); res.end(yml); return;
  }
  /* la place de l'API de GitHub, pour la bascule sur le lien */
  if (u === "/repos/Ylfik/otp-lol-calc/releases") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify([{
      tag_name: "overlay-v" + NEW_VERSION, draft: false, prerelease: false,
      html_url: "https://github.com/Ylfik/otp-lol-calc/releases/tag/overlay-v" + NEW_VERSION,
      published_at: new Date().toISOString(), assets: []
    }]));
    return;
  }
  if (u === "/" + FILE) {
    res.writeHead(200, { "content-type": "application/octet-stream",
                         "content-length": String(payload.length) });
    /* servi au compte-gouttes : un telechargement instantane ne leve
       aucun evenement de progression, et c'est la barre qu'on veut voir */
    let at = 0;
    const CHUNK = 512 * 1024;
    const push = () => {
      if (at >= payload.length) { res.end(); return; }
      const end = Math.min(at + CHUNK, payload.length);
      const more = res.write(payload.subarray(at, end));
      at = end;
      if (more) setTimeout(push, 90); else res.once("drain", () => setTimeout(push, 90));
    };
    push();
    return;
  }
  /* pas de .blockmap : le téléchargement différentiel échoue et
     electron-updater retombe sur le téléchargement complet, ce qui est
     exactement le chemin à éprouver */
  res.writeHead(404); res.end("non");
});
await new Promise(r => feed.listen(FEED_PORT, "127.0.0.1", r));
say(`faux dépôt sur http://127.0.0.1:${FEED_PORT} — version annoncée ${NEW_VERSION}`);

writeFileSync(DEV_CONFIG, `provider: generic\nurl: http://127.0.0.1:${FEED_PORT}/\n`);

/* hors AppImage, electron-updater refuse de télécharger : on lui donne
   un fichier bidon comme "version actuelle". Il n'est que lu. */
const fakeDir = mkdtempSync(path.join(tmpdir(), "appimage-"));
const fakeOld = path.join(fakeDir, "LoL Overlay.AppImage");
writeFileSync(fakeOld, randomBytes(1024));

/* hors installation, electron-updater n'a pas d'app-update.yml et donc
   pas de updaterCacheDirName : il se rabat sur le nom de l'app. Les deux
   emplacements sont nettoyes puis cherches. */
const caches = ["lol-overlay-updater", "lol-overlay"].flatMap(n => [
  path.join(process.env.HOME || tmpdir(), ".cache", n),
  path.join(process.env.HOME || tmpdir(), ".cache", n, "pending")
]);
for (const c of ["lol-overlay-updater", "lol-overlay"])
  rmSync(path.join(process.env.HOME || tmpdir(), ".cache", c), { recursive: true, force: true });

/* ---- l'app ---------------------------------------------------------- */

const kids = [];
const stopAll = () => {
  kids.forEach(k => { try { k.kill("SIGKILL"); } catch {} });
  try { feed.close(); } catch {}
  try { rmSync(DEV_CONFIG); } catch {}
  try { rmSync(fakeDir, { recursive: true, force: true }); } catch {}
};
process.on("exit", stopAll);

const electron = path.join(root, "node_modules", "electron", "dist", "electron");
const app = spawn(electron, [".", `--remote-debugging-port=${CDP_PORT}`, "--no-sandbox"], {
  cwd: root,
  env: {
    ...process.env,
    OVERLAY_UPDATE_DEV: "1",
    OVERLAY_GITHUB: `http://127.0.0.1:${FEED_PORT}`,
    APPIMAGE: fakeOld,
    OVERLAY_DEBUG: "1",
    OVERLAY_PORT: "2994",                     /* personne n'écoute : pas de partie */
    OVERLAY_SCHEME: "http",
    OVERLAY_LOCKFILE: path.join(tmpdir(), "pas-de-client-" + Date.now())
  },
  stdio: ["ignore", "pipe", "pipe"]
});
kids.push(app);
const journal = [];
const note = s => { journal.push(String(s)); };
app.stdout.on("data", d => { note(d); if (/\[maj\]/.test(String(d))) process.stdout.write("  [app] " + d); });
app.stderr.on("data", d => { const s = String(d); note(s);
  if (/\[maj\]/.test(s)) process.stdout.write("  [app] " + s); });

/* ---- CDP ------------------------------------------------------------ */

async function hubTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const t = list.find(x => x.type === "page" && /hub\.html/.test(x.url));
      if (t) return t;
    } catch { /* pas encore */ }
    await wait(500);
  }
  throw new Error("fenetre hub introuvable");
}
const t = await hubTarget();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error("CDP refuse")); });
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const evaluate = expr => new Promise((ok, no) => {
  const n = ++id;
  pending.set(n, m => {
    if (m.error) return no(new Error(m.error.message));
    if (m.result?.exceptionDetails) return no(new Error(m.result.result?.description || "erreur page"));
    ok(m.result?.result?.value);
  });
  ws.send(JSON.stringify({ id: n, method: "Runtime.evaluate",
    params: { expression: expr, awaitPromise: true, returnByValue: true } }));
});

const panel = () => evaluate(`JSON.stringify({
  hidden: document.getElementById("updBox").hidden,
  txt: document.getElementById("updTxt").textContent,
  sub: document.getElementById("updSub").textContent,
  install: !document.getElementById("updInstall").hidden,
  bar: !document.getElementById("updBar").hidden,
  width: document.getElementById("updFill").style.width
})`).then(JSON.parse);

const shot = async name => {
  if (!process.env.DISPLAY) return;
  await new Promise(r => spawn("import", ["-window", "root", path.join(SHOTS, name)], { stdio: "ignore" }).on("exit", r));
};
spawn("mkdir", ["-p", SHOTS]).on("exit", () => {});

/* ---- le déroulé ------------------------------------------------------ */

say(`scenario « ${MODE} » — au repos, la section mise a jour doit etre absente`);
await wait(1200);
check((await panel()).hidden === true, "rien n'est annonce avant la recherche");

/* la recherche part 4 s apres le demarrage */
const seen = new Set();
const wanted = MODE === "auto" ? /prête/ : /disponible/;
let fini = null;
for (let i = 0; i < 80 && !fini; i++) {
  await wait(500);
  const p = await panel();
  if (p.txt && !seen.has(p.txt)) { seen.add(p.txt); say("panneau : " + p.txt + (p.sub ? " — " + p.sub : "")); }
  if (/Téléchargement/.test(p.txt) && p.bar) await shot("1-telechargement.png");
  if (wanted.test(p.txt)) fini = p;
  if (/impossible/.test(p.txt)) { fini = p; break; }
}

if (MODE === "auto") {
  check(!!fini && /prête/.test(fini.txt), "la mise a jour arrive jusqu'a « prête »");
  check(!!fini && /9\.9\.9/.test(fini.txt), "c'est bien la version annoncee : " + (fini?.txt || "—"));
  check(!!fini && fini.install === true, "le bouton « Installer et redemarrer » est apparu");
  check(!!fini && /0\.2\.0/.test(fini.sub), "la version installee est rappelee : " + (fini?.sub || "—"));
  check([...seen].some(x => /Téléchargement/.test(x)), "le telechargement s'est annonce en chemin");
  await shot("2-prete.png");

  check(served.includes("/latest-linux.yml"), "l'app a lu le fichier de version");
  check(served.includes("/" + FILE), "l'app a telecharge l'installeur annonce");

  const inCache = caches.filter(existsSync).flatMap(c =>
    readdirSync(c).filter(f => statSync(path.join(c, f)).isFile())
      .map(f => ({ f, size: statSync(path.join(c, f)).size })));
  const got = inCache.find(x => x.f.endsWith(".AppImage"));
  check(!!got, "le fichier est dans le cache de mise a jour : " + JSON.stringify(inCache.map(x => x.f)));
  check(got?.size === payload.length, `il fait la taille annoncee (${got?.size} / ${payload.length})`);
  check(!journal.some(l => /sha512|checksum/i.test(l)), "aucune plainte sur la somme de controle");
  check(!journal.some(l => /quitAndInstall|APPIMAGE_SILENT_INSTALL/.test(l)), "rien ne s'est installe tout seul");
} else {
  check(!!fini && /disponible/.test(fini.txt), "une Release sans metadonnees reste annoncee : " + (fini?.txt || "—"));
  check(!!fini && /9\.9\.9/.test(fini.txt), "avec le bon numero de version");
  check(!!fini && /main/.test(fini.sub), "et dite comme etant a installer a la main : " + (fini?.sub || "—"));
  check(!!fini && fini.install === false, "aucun bouton d'installation qui ne menerait nulle part");
  check(!seen.has("Mise à jour impossible"), "aucune erreur n'est montree au joueur");
  check(served.includes("/repos/Ylfik/otp-lol-calc/releases"), "l'app est bien retombee sur la liste des Releases");
  check(!served.includes("/" + FILE), "et n'a rien telecharge");
  await shot("3-manuel.png");
}

stopAll();
console.log(`\n  ${failed.length ? "ECHECS : " + failed.join(" ; ") : "tout est passe."}`);
console.log(`  captures dans ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
