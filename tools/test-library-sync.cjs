/* La bibliothèque en ligne : est-ce que TOUS les builds enregistrés
 * montent, ou seulement ceux du champion ouvert ?
 *
 * C'est la question qui a fait qu'Udyr n'apparaissait pas dans l'app
 * alors que des builds existaient : ils n'avaient jamais quitté le
 * navigateur. Ce fichier rejoue la connexion avec un faux Supabase et
 * regarde ce qui part réellement.
 *
 *   node tools/test-library-sync.cjs
 *
 * La page est servie en HTTP sur la boucle locale : sous file://, jsdom
 * ne donne pas de localStorage, et le test passerait sur du vide.
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
let failed = [];
const check = (ok, what) => {
  console.log((ok ? "  ok   " : "  RATE ") + what);
  if (!ok) failed.push(what);
};

const srv = http.createServer((req, res) => {
  const file = path.join(ROOT, (req.url || "/").split("?")[0] === "/" ? "index.html" : decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("non"); return;
  }
  const type = file.endsWith(".js") ? "text/javascript"
    : file.endsWith(".json") ? "application/json" : "text/html; charset=utf-8";
  res.writeHead(200, { "content-type": type });
  res.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(r => srv.listen(8731, "127.0.0.1", r));

  const dom = await JSDOM.fromURL("http://127.0.0.1:8731/", {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    resources: undefined          /* pas de CDN : seul le script de la page nous intéresse */
  });
  const w = dom.window;
  await new Promise(r => w.addEventListener("load", r, { once: true }));
  await new Promise(r => setTimeout(r, 400));

  if (typeof w.eval("typeof libSyncAll") !== "string" || w.eval("typeof libSyncAll") !== "function") {
    console.log("  la page n'a pas defini libSyncAll — le script s'est arrete avant");
    srv.close(); w.close(); process.exit(1);
  }

  /* ---- ce que ce navigateur a en reserve ------------------------- */

  w.eval(`
    localStorage.clear();
    localStorage.setItem("otp-calc-builds:udyr", JSON.stringify({
      "AD BRUISER": { champ: "udyr", level: 18, q: 6 },
      "TANK":       { champ: "udyr", level: 18, w: 6 }
    }));
    localStorage.setItem("otp-calc-builds:ekko", JSON.stringify({
      "AP": { champ: "ekko", level: 18, q: 5 }
    }));
    /* sauvegarde d'avant les champions : pas de champ, le seau fait foi */
    localStorage.setItem("otp-calc-builds:kayle", JSON.stringify({
      "VIEUX": { level: 11 }
    }));
    /* une cle qui n'est pas une bibliotheque : elle ne doit rien produire */
    localStorage.setItem("otp-calc-theme", "dark");
  `);

  /* ---- un faux Supabase, qui note ce qu'on lui donne -------------- */

  w.eval(`
    globalThis.__envoye = [];
    globalThis.__deja = [];
    me = { id: "moi" };
    CHAMP = null;                       /* on est sur l'accueil, pas sur un champion */
    sb = {
      from(table){
        if(table !== "library") throw new Error("table inattendue : " + table);
        return {
          select(){ return { eq(){ return Promise.resolve({ data: globalThis.__deja, error: null }); } }; },
          upsert(rows, opts){
            globalThis.__envoye.push({ rows: rows, opts: opts });
            return Promise.resolve({ error: null });
          }
        };
      }
    };
  `);

  /* ---- premiere connexion : tout doit monter ---------------------- */

  const sent = await w.eval("libSyncAll()");
  const rows = w.eval("JSON.stringify(globalThis.__envoye.flatMap(e => e.rows))");
  const got = JSON.parse(rows);

  check(sent === 4, `les quatre builds des trois champions partent (recu ${sent})`);
  const pairs = got.map(r => r.champion + "/" + r.name).sort();
  check(JSON.stringify(pairs) === JSON.stringify(["ekko/AP", "kayle/VIEUX", "udyr/AD BRUISER", "udyr/TANK"]),
    "et ce sont les bons : " + JSON.stringify(pairs));
  check(got.every(r => r.owner === "moi"), "chacun porte son proprietaire");
  check(got.every(r => r.data && typeof r.data === "object"),
    "le build complet est envoye, pas seulement son nom");
  check(got.find(r => r.name === "VIEUX")?.champion === "kayle",
    "un build sans champion enregistre herite de son seau");
  const opts = w.eval("JSON.stringify(globalThis.__envoye[0].opts)");
  check(/owner,champion,name/.test(opts), "l'envoi ecrase par cle, il ne duplique pas");

  /* ---- deuxieme connexion : rien a refaire ------------------------ */

  w.eval(`
    globalThis.__deja = globalThis.__envoye.flatMap(e => e.rows)
      .map(r => ({ champion: r.champion, name: r.name }));
    globalThis.__envoye = [];
  `);
  const again = await w.eval("libSyncAll()");
  check(again === 0, `une connexion suivante n'envoie rien (recu ${again})`);
  check(w.eval("globalThis.__envoye.length") === 0, "et ne touche pas a la table");

  /* ---- un build nouveau depuis l'autre machine -------------------- */

  w.eval(`
    const all = JSON.parse(localStorage.getItem("otp-calc-builds:udyr"));
    all["SPLIT"] = { champ: "udyr", level: 16 };
    localStorage.setItem("otp-calc-builds:udyr", JSON.stringify(all));
  `);
  const troisieme = await w.eval("libSyncAll()");
  check(troisieme === 1, `seul le build nouveau part (recu ${troisieme})`);
  check(w.eval("JSON.stringify(globalThis.__envoye.flatMap(e=>e.rows).map(r=>r.name))") === '["SPLIT"]',
    "et c'est bien celui-la");

  /* ---- sans compte, rien ne part ---------------------------------- */

  w.eval("globalThis.__envoye = []; me = null;");
  const horsCompte = await w.eval("libSyncAll()");
  check(horsCompte === 0 && w.eval("globalThis.__envoye.length") === 0,
    "sans connexion, aucun envoi");

  /* ---- une table qui refuse ne casse rien ------------------------- */

  w.eval(`
    me = { id: "moi" };
    globalThis.__deja = [];
    globalThis.__envoye = [];
    sb = { from(){ return {
      select(){ return { eq(){ return Promise.resolve({ data: null, error: { message: "refuse" } }); } }; },
      upsert(){ throw new Error("ne devrait pas etre appele"); }
    }; } };
  `);
  let creve = false;
  try { await w.eval("libSyncAll()"); } catch { creve = true; }
  check(!creve, "une erreur de la base ne fait pas tomber la page");
  check(w.eval("libNote") === "refuse", "mais elle est retenue pour etre dite");

  srv.close(); w.close();
  console.log(failed.length ? "\n  ECHECS : " + failed.join(" ; ") : "\n  tout est passe.");
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); srv.close(); process.exit(1); });
