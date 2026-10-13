/* Confronte les modules generes aux seize modules ecrits a la main.

   Les modules ecrits a la main ont ete corriges contre le jeu, partie apres
   partie : ce sont eux la reponse connue. Ce controle regenere les memes
   seize champions depuis les donnees et demande, pour chacun :

     1. chaque table de `ranks` du module manuel se retrouve-t-elle dans le
        module genere ?
     2. chaque valeur que `abilities()` produit a la main se retrouve-t-elle
        parmi celles du module genere, sur plusieurs builds ?

   Une valeur retrouvee prouve que le generateur lit la meme chose dans les
   donnees. Une valeur manquante dit exactement ce que le generateur ne sait
   pas faire — c'est la seule chose qui compte avant de generer 159 modules.

   Usage : node tools/check-generated.js            resume
           node tools/check-generated.js -v         detail des manques       */

const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { generate } = require("./generate-module.js");

const ROOT = path.join(__dirname, "..");
const HAND = path.join(ROOT, "champions");

/* le module manuel et le fichier de donnees qui lui correspond */
const PAIRS = {
  "udyr.js": "Udyr", "ekko.js": "Ekko", "elise.js": "Elise", "irelia.js": "Irelia",
  "shen.js": "Shen", "tahmkench.js": "Tahm Kench", "zeri.js": "Zeri", "yunara.js": "Yunara",
  "kayle.js": "Kayle", "chogath.js": "Cho'Gath", "lillia.js": "Lilia",
  "mordekaiser.js": "Mordekaiser", "xinzhao.js": "Xin Zhao", "thresh.js": "Thresh",
  "kindred.js": "Kindred", "twitch.js": "Twitch"
};

/* ---------- chargement d'un module ------------------------------------- */

function loadSrc(src){
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { timeout: 5000 });
  return sandbox.window.CHAMPION;
}
const loadFile = f => loadSrc(fs.readFileSync(f, "utf8"));

/* ---------- le contexte que index.html passe a abilities() -------------- */

const lerp = (a, b, lvl, top) => top
  ? a + (b - a) / (top - 1) * (Math.min(lvl, top) - 1)
  : a + (b - a) / 17 * (lvl - 1);
const R1 = (arr, rank) => arr[Math.min(6, Math.max(1, rank)) - 1];
function msSoftCap(ms){
  if(ms > 490) return ms * 0.5 + 230;
  if(ms > 415) return ms * 0.8 + 83;
  if(ms < 220) return ms * 0.5 + 110;
  return ms;
}

/* un build : niveau, rangs, et ce que les items apportent */
function context(CH, b){
  const L = b.L;
  const gr = (L - 1) * (0.7025 + 0.0175 * (L - 1));
  const CB = CH.base, at = ([v, per]) => v + per * gr;
  const base = { hp: at(CB.hp), mana: at(CB.mana), ad: at(CB.ad), ap: 0,
                 ar: at(CB.ar), mr: at(CB.mr), ah: 0, as: CB.as, ms: CB.ms };
  const S = { hp: 0, mana: 0, ar: 0, mr: 0, ad: 0, ap: 0, ah: 0, as: 0, crit: 0, critdmg: 0,
              letha: 0, arpen: 0, mrpenflat: 0, mrpen: 0, ls: 0, ov: 0, ms: 0, mspct: 0,
              hs: 0, ten: 0, slow: 0, adapt: 0, uh: 0 };
  const bonusAD = b.ad || 0, bonusAP = b.ap || 0, bonusHP = b.hp || 0;
  const tot = {
    hp: base.hp + bonusHP, mana: base.mana, ad: base.ad + bonusAD, ap: bonusAP,
    ar: base.ar, mr: base.mr, ah: b.ah || 0, as: base.as, ms: base.ms,
    mspct: 0, crit: b.crit || 0, critdmg: 0, letha: 0, arpen: 0, mrpenflat: 0, mrpen: 0,
    ls: 0, ov: 0, hs: 0, ten: 0, slow: 0, uh: b.uh || 0,
    bonusHP, bonusAD, bonusAP, bonusASpct: 0
  };
  const cap = CH.rankCap ? CH.rankCap(L) : Math.min(5, Math.floor((L + 1) / 2));
  const capR = CH.rankCapR ? CH.rankCapR(L) : cap;
  const T = CH.ranks;
  return {
    A: {}, T, R1, lerp, L,
    qr: Math.max(1, Math.min(cap, b.r || 5)), wr: Math.max(1, Math.min(cap, b.r || 5)),
    er: Math.max(1, Math.min(cap, b.r || 5)), rr: Math.max(1, Math.min(capR, b.rr || 3)),
    tot, base, S, bonusAD, bonusHP,
    learned: { q: true, w: true, e: true, r: true },
    has: () => false, msSoftCap,
    qBonusAS: T && T.qBonusAS ? R1(T.qBonusAS, Math.max(1, Math.min(cap, b.r || 5))) : 0,
    qAwkBonusAS: T && T.qBonusAS ? lerp(20, 70, L) + R1(T.qBonusAS, Math.max(1, Math.min(cap, b.r || 5))) : 0,
    stacks: b.stacksOverride !== undefined ? b.stacksOverride : (CH.stacks ? CH.stacks.def : 0)
  };
}

/* trois builds : un debut de partie, un milieu, une fin avec des items */
const BUILDS = [
  { L: 1,  r: 1, rr: 1, ad: 0,   ap: 0,   hp: 0,   ah: 0,  crit: 0,  uh: 0,  n: "niveau 1, rang 1" },
  { L: 9,  r: 3, rr: 2, ad: 40,  ap: 60,  hp: 300, ah: 20, crit: 25, uh: 10, n: "niveau 9, rang 3" },
  { L: 18, r: 5, rr: 3, ad: 150, ap: 250, hp: 900, ah: 40, crit: 60, uh: 20, n: "niveau 18, rang 5" }
];

/* ---------- comparaisons ------------------------------------------------ */

const EPS = 1e-6;
const near = (a, b, rel) => Math.abs(a - b) <= Math.max(rel === EPS ? 1e-6 : 0.011, Math.abs(b) * rel);

/* les tables et scalaires de ranks{}, par valeur */
function rankTables(mod){
  const out = [];
  for(const [k, v] of Object.entries(mod.ranks || {})){
    if(Array.isArray(v) && v.every(x => typeof x === "number")) out.push({ k, arr: v });
    else if(typeof v === "number") out.push({ k, arr: [v] });
  }
  return out;
}

/* Une meme table peut etre rangee a une autre echelle : 1.2 pour 120 %, 0.35
   pour 35 %. Comme tools/check-abilities.js, la comparaison essaie les trois
   echelles plutot que de crier a l'ecart. */
function sameTable(a, b){
  if(a.length !== b.length) return false;
  return [1, 100, 0.01].some(k => a.every((v, i) => near(v, b[i] * k, 0.002)));
}

/* toutes les valeurs numeriques que abilities() a posees dans A */
function valuesOf(mod, b){
  const c = context(mod, b);
  let A;
  try { A = mod.abilities(c); } catch(err){ return { error: err.message }; }
  const out = {};
  for(const [k, v] of Object.entries(A))
    if(typeof v === "number" && Number.isFinite(v)) out[k] = v;
  return out;
}

/* Pourquoi une valeur manuelle n'a pas d'equivalent genere. Les raisons sont
   lues, pas supposees : le compteur se teste en le vidant, le passif se lit
   dans les TODO du module genere, la deuxieme forme se voit dans le nom. */
function why(k, perBuild, noStack, noCrit, todo, file){
  const moved = (other) => perBuild.some((x, i) => {
    const a = x.hand[k], b = other[i][k];
    return typeof a === "number" && typeof b === "number" && Math.abs(a - b) > 1e-9;
  });
  if(moved(noStack)) return "compteur de charges";
  if(moved(noCrit))  return "depend du taux de critique";
  if(/Awk/.test(k)) return "forme eveillee";
  if(/^s[qwer]|spider/i.test(k)) return "deuxieme forme";
  if(todo.some(t => /six rangs/.test(t))) return "kit a six rangs";
  if(/^p[A-Z]|^(reso|resoMs)/.test(k))
    return todo.some(t => /passif : aucune ligne chiffree/.test(t)) ? "passif sans chiffres dans les donnees" : "passif";
  const known = KNOWN[`${file} ${k}`];
  return known ? known : "a examiner";
}

/* Les ecarts qui restent apres les quatre tests ci-dessus, chacun regarde
   dans les donnees et explique. Ils sont ecrits ici pour qu'un ecart NOUVEAU
   ressorte au lieu de se perdre dans le bruit, comme dans
   tools/check-abilities.js. */
const KNOWN = {
  "ekko.js wLowPct":    "valeur de la description du wiki, absente du bloc de donnees",
  "ekko.js wLowMin":    "valeur de la description du wiki, absente du bloc de donnees",
  "elise.js eRappelCd": "recharge du Rappel : deuxieme bloc E du wiki, non modelise",
  "shen.js qAS":        "vitesse d'attaque du Q : valeur de la description, absente des donnees",
  "tahmkench.js wRefund": "ligne « Cooldown Refunded » ecartee : le generateur ne modelise pas les remboursements de recharge",
  "tahmkench.js eCd":   "le module manuel n'applique pas l'accelaration au E, le generateur si",
  "zeri.js qPerHit":    "7 projectiles par rafale : nombre lu dans la description, absent des donnees",
  "zeri.js qRounds":    "idem : le nombre de projectiles n'est pas dans les donnees",
  "zeri.js rQbonus":    "DESACCORD REEL : le module attache 22-30 au R (3 rangs), le wiki au E (5 rangs)",
  "kindred.js eSlow":   "ralentissement du E (30 % + 5 % par 100 AP) : ecrit dans la description du wiki, pas dans ses lignes de donnees",
  "yunara.js wLinger":  "le total residuel est 60 % des degats initiaux, chiffre de la description",
  "mordekaiser.js qFlat": "DESACCORD REEL : le wiki fait monter le Q de 0 a 85 du niveau 1 au 18, le module ajoute 5 par niveau a partir du 10",
  "mordekaiser.js qIso":  "meme ecart que qFlat, repercute sur la cible isolee",
  "mordekaiser.js rCd":   "DESACCORD REEL deja connu : module 140/130/120, wiki 140/120/100"
};

/* ---------- controle de tenue : tout module genere doit tourner ---------- */

/* Un module qui leve une exception casse la page du champion. Celui-ci se
   contente donc d'appeler tout ce qu'index.html appelle : abilities(), les
   deux fonctions de lignes, et onStep sur chaque entree du menu. */
function smoke(mod){
  const errs = [];
  for(const b of BUILDS){
    const c = context(mod, b);
    let A;
    try { A = mod.abilities(c); } catch(err){ errs.push(`abilities() ${b.n} : ${err.message}`); continue; }
    const fmt = { TR: k => k, n0: v => String(Math.round(v)), pc: v => v + "%",
                  nf1: { format: v => String(v) }, A, M: {} };
    try { if(mod.passiveRows) mod.passiveRows(fmt); } catch(err){ errs.push(`passiveRows ${b.n} : ${err.message}`); }
    try { if(mod.abilityRows) mod.abilityRows(fmt); } catch(err){ errs.push(`abilityRows ${b.n} : ${err.message}`); }
    for(const st of (mod.stepMenu || [])){
      try {
        mod.onStep(st.id, st, { A, hp: 2400, cur: 1800, a: 1, pMul: 1, mMul: 1,
                                tot: c.tot, memo: {}, onHits: [], charged: false });
      } catch(err){ errs.push(`onStep ${st.id} ${b.n} : ${err.message}`); }
    }
    for(const [k, v] of Object.entries(A))
      if(typeof v === "number" && !Number.isFinite(v)) errs.push(`A.${k} n'est pas un nombre (${v}) en ${b.n}`);
  }
  return errs;
}

if(process.argv.includes("--all")){
  const { targets } = require("./generate-module.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "otp-all-"));
  let ok = 0, bad = [];
  for(const t of targets()){
    try {
      const r = generate(t.file, dir);
      const errs = smoke(loadSrc(r.src));
      if(errs.length) bad.push({ key: t.key, errs });
      else ok++;
    } catch(err){ bad.push({ key: t.key, errs: ["generation : " + err.message] }); }
  }
  console.log(`modules qui tournent sans erreur : ${ok} / ${ok + bad.length}`);
  bad.forEach(b => console.log(`  ${b.key} : ${b.errs.slice(0, 3).join(" | ")}`));
  process.exit(bad.length ? 1 : 0);
}

/* ---------- controle ---------------------------------------------------- */

const verbose = process.argv.includes("-v");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "otp-gen-"));
const report = [];

for(const [file, champ] of Object.entries(PAIRS)){
  const hand = loadFile(path.join(HAND, file));
  let gen, todo = [];
  try {
    const r = generate(file.replace(/\.js$/, ""), tmp);
    gen = loadSrc(r.src); todo = r.todo;
  } catch(err){
    report.push({ file, champ, fatal: err.message });
    continue;
  }

  /* 1. tables de ranks */
  const hTabs = rankTables(hand), gTabs = rankTables(gen);
  const tabMiss = [];
  for(const t of hTabs){
    const hit = gTabs.find(g => sameTable(t.arr, g.arr));
    if(!hit) tabMiss.push(t);
  }

  /* 2. valeurs de abilities() */
  const todoList = todo;
  const perBuild = BUILDS.map(b => ({ b, hand: valuesOf(hand, b), gen: valuesOf(gen, b) }));
  /* Une valeur qui bouge quand on vide le compteur du champion depend de ce
     compteur : le wiki ne dit pas combien de charges un build tient, donc le
     generateur ne peut pas la produire. */
  const noStack = BUILDS.map(b => valuesOf(hand, { ...b, stacksOverride: 0 }));
  /* meme idee pour le critique : le module manuel fait parfois monter un sort
     avec le taux de critique, ce que le wiki n'ecrit pas dans ses tables */
  const noCrit = BUILDS.map(b => valuesOf(hand, { ...b, crit: 0 }));
  const err = perBuild.find(x => x.hand.error || x.gen.error);
  if(err){
    report.push({ file, champ, fatal: "abilities() : " + (err.hand.error || err.gen.error) });
    continue;
  }
  /* une valeur manuelle compte comme reproduite si, dans chaque build, une
     valeur du module genere lui est egale */
  const keys = new Set();
  perBuild.forEach(x => Object.keys(x.hand).forEach(k => keys.add(k)));
  const exact = [], close = [], missing = [];
  for(const k of keys){
    let allExact = true, allClose = true, seen = 0;
    for(const x of perBuild){
      const v = x.hand[k];
      if(typeof v !== "number" || Math.abs(v) < 1e-9) continue;   /* 0 ne prouve rien */
      seen++;
      const vals = Object.values(x.gen);
      if(!vals.some(g => near(g, v, EPS))) allExact = false;
      if(!vals.some(g => near(g, v, 0.005))) allClose = false;
    }
    if(!seen) continue;
    if(allExact) exact.push(k);
    else if(allClose) close.push(k);
    else missing.push({ k, vals: perBuild.map(x => x.hand[k]), why: why(k, perBuild, noStack, noCrit, todoList, file) });
  }
  report.push({ file, champ, hTabs: hTabs.length, tabMiss, exact, close, missing, todo: todo.length });
}

/* ---------- sortie ------------------------------------------------------ */

let perfect = 0;
console.log("champion            tables ranks     valeurs abilities()        TODO");
for(const r of report){
  if(r.fatal){ console.log(`${r.file.padEnd(18)} ECHEC : ${r.fatal}`); continue; }
  const nk = r.exact.length + r.close.length + r.missing.length;
  const okTab = r.hTabs - r.tabMiss.length;
  const ok = !r.tabMiss.length && !r.missing.length;
  if(ok) perfect++;
  console.log(`${r.file.padEnd(18)} ${String(okTab + "/" + r.hTabs).padEnd(16)} ${String(r.exact.length + "+" + r.close.length + "/" + nk).padEnd(26)} ${r.todo}${ok ? "   OK" : ""}`);
}
console.log(`\nchampions reproduits au chiffre pres, passif compris : ${perfect}/${report.length}`);
/* le total par raison : c'est lui qui dit ce qui resiste a la generation */
const byWhy = {};
report.forEach(r => (r.missing || []).forEach(m => byWhy[m.why] = (byWhy[m.why] || 0) + 1));
const totVals = report.reduce((n, r) => n + (r.exact ? r.exact.length + r.close.length + r.missing.length : 0), 0);
const totOk = report.reduce((n, r) => n + (r.exact ? r.exact.length + r.close.length : 0), 0);
console.log(`valeurs reproduites, tous champions : ${totOk}/${totVals}`);
console.log("valeurs manquantes, par raison :");
Object.entries(byWhy).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
const unexplained = report.reduce((n, r) => n + (r.missing || []).filter(m => m.why === "a examiner").length, 0);
console.log(`ecarts encore INEXPLIQUES : ${unexplained}`);
const clean = report.filter(r => !r.fatal && !r.missing.some(m => m.why === "a examiner")).length;
console.log(`champions dont tous les ecarts sont expliques : ${clean}/${report.length}`);
process.exitCode = unexplained ? 1 : 0;
console.log("colonnes : tables de ranks retrouvees | valeurs identiques + valeurs a 0,5 % pres / total | lignes TODO du module genere");

if(verbose){
  for(const r of report){
    if(r.fatal) continue;
    if(!r.tabMiss.length && !r.missing.length) continue;
    console.log(`\n--- ${r.file}`);
    r.tabMiss.forEach(t => console.log(`  table absente   ${t.k} = [${t.arr.join(", ")}]`));
    r.missing.forEach(m => console.log(`  valeur absente  A.${m.k} = ${m.vals.map(v => v === undefined ? "-" : Math.round(v * 100) / 100).join(" | ")}   [${m.why}]`));
    if(r.close.length) console.log(`  a 0,5 % pres    ${r.close.join(", ")}`);
  }
}
