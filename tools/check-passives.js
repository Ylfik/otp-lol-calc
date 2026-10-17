/* Les passifs écrits à la main, confrontés à la phrase du wiki qui les définit.
 *
 * Le générateur ne sait pas lire les passifs : le wiki met leurs chiffres
 * dans la prose. Ils sont donc les seules lignes d'un module que personne
 * n'a vérifiées — et une erreur y est invisible, parce qu'un passif faux
 * donne quand même un nombre plausible.
 *
 * Chaque attente ci-dessous cite sa source. La valeur attendue est
 * calculée à la main depuis cette phrase, jamais depuis le module : un
 * contrôle qui recopie le code qu'il contrôle ne contrôle rien.
 *
 *   node tools/check-passives.js            tout
 *   node tools/check-passives.js lux        un champion
 */

const fs = require("fs");
const path = require("path");
const { loadFile, context } = require("./champ-context.js");

const ROOT = path.join(path.dirname(__dirname));
const HAND = path.join(ROOT, "champions");

/* Un cas : un build, un champ de A, et ce que le wiki impose.
   `pres` est la tolérance absolue (les arrondis du wiki). */
const ATTENTES = [
  {
    champ: "lux",
    source: "data/champions/Lux, Illumination : « deal 30 to 200 (par niveau) (+ 35% AP) bonus magic damage »",
    cas: [
      /* 30 au niveau 1, 200 au niveau 18, linéaire entre les deux */
      { n: "niveau 1, sans AP",   build: { L: 1,  ap: 0 },   champ_: "pDmg", attendu: 30 },
      { n: "niveau 18, sans AP",  build: { L: 18, ap: 0 },   champ_: "pDmg", attendu: 200 },
      /* 10 paliers sur 17 entre 30 et 200 : 30 + 170*9/17 = 120 */
      { n: "niveau 10, sans AP",  build: { L: 10, ap: 0 },   champ_: "pDmg", attendu: 120 },
      /* le ratio : 35 % de l'AP, ajouté au palier du niveau */
      { n: "niveau 1, 100 AP",    build: { L: 1,  ap: 100 }, champ_: "pDmg", attendu: 65 },
      { n: "niveau 18, 200 AP",   build: { L: 18, ap: 200 }, champ_: "pDmg", attendu: 270 }
    ]
  }
];

/* ------------------------------------------------------------------ */

const BUILD_PLEIN = { L: 18, r: 5, rr: 3, ad: 0, ap: 0, hp: 0, ah: 0, crit: 0, uh: 0 };

function valeur(mod, build, champ_) {
  const c = context(mod, { ...BUILD_PLEIN, ...build });
  const A = mod.abilities(c);
  return A[champ_];
}

const seulement = process.argv.slice(2).filter(a => !a.startsWith("-"));
let rates = 0, passes = 0, manquants = [];

for (const bloc of ATTENTES) {
  if (seulement.length && !seulement.includes(bloc.champ)) continue;
  const f = path.join(HAND, bloc.champ + ".js");
  if (!fs.existsSync(f)) { manquants.push(bloc.champ); continue; }

  console.log("\n--- " + bloc.champ);
  console.log("    source : " + bloc.source);
  let mod;
  try { mod = loadFile(f); }
  catch (e) { console.log("    RATE  le module ne se charge pas : " + e.message); rates++; continue; }

  for (const t of bloc.cas) {
    let v;
    try { v = valeur(mod, t.build, t.champ_); }
    catch (e) { console.log("    RATE  " + t.n + " : " + e.message); rates++; continue; }
    if (v === undefined) {
      console.log(`    RATE  ${t.n} : A.${t.champ_} n'existe pas`);
      rates++; continue;
    }
    const pres = t.pres === undefined ? 0.01 : t.pres;
    const ok = Math.abs(v - t.attendu) <= pres;
    console.log(`    ${ok ? "ok   " : "RATE "} ${t.n} : A.${t.champ_} = ${Math.round(v * 100) / 100}` +
                (ok ? "" : `  (attendu ${t.attendu})`));
    ok ? passes++ : rates++;
  }
}

/* Un champion publié dont le passif n'est pas ici est un champion dont
   personne n'a vérifié le passif : on le dit. */
const publies = fs.readdirSync(HAND).filter(f => f.endsWith(".js")).map(f => f.replace(".js", ""));
const couverts = new Set(ATTENTES.map(a => a.champ));
const sansControle = publies.filter(k => !couverts.has(k));

console.log(`\n${passes} attentes tenues, ${rates} manquees.`);
if (manquants.length) console.log("modules absents : " + manquants.join(", "));
if (sansControle.length)
  console.log(`champions publies sans controle de passif (${sansControle.length}) : ` + sansControle.join(", "));
process.exit(rates ? 1 : 0);
