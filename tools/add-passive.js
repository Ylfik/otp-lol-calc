/* Pose le passif d'un champion sur son module généré, et le publie.
 *
 * Le générateur écrit tout sauf le passif : le wiki met les chiffres de
 * celui-ci dans sa prose. Plutôt que de recopier à la main les mêmes
 * quatre insertions cent fois — en les ratant une fois sur dix — cet
 * outil les applique depuis une description, et vérifie en sortant que
 * le module se charge toujours.
 *
 * Il ne décide rien : les formules viennent de l'appelant, qui les a
 * lues dans data/champions/<Nom>. Ce fichier ne fait que les poser au
 * bon endroit.
 *
 *   node tools/add-passive.js <recette.json>
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.dirname(__dirname);
const { loadSrc } = require("./champ-context.js");

/* une recette :
   { key, entete, ranks, calcul, l10n, rows, menu, step } — tout optionnel
   sauf key, l10n et rows. */
function pose(r) {
  const src = path.join(ROOT, "generated", r.key + ".js");
  const dst = path.join(ROOT, "champions", r.key + ".js");
  if (!fs.existsSync(src)) throw new Error("module généré absent : " + r.key);
  let s = fs.readFileSync(src, "utf8");

  /* l'en-tête du généré dit « à relire » : il ne l'est plus */
  const fin = s.indexOf("*/") + 2;
  s = r.entete + s.slice(fin);

  if (r.ranks) {
    const m = /\n    \},\n    abilities\(c\)\{/.exec(s);
    if (!m) throw new Error(r.key + " : fin du bloc ranks introuvable");
    s = s.slice(0, m.index) + ",\n" + r.ranks + s.slice(m.index);
  }

  if (r.calcul) {
    const anchor = "      A.msIdle = c.msSoftCap(";
    if (!s.includes(anchor)) throw new Error(r.key + " : A.msIdle introuvable");
    s = s.replace(anchor, r.calcul + "\n" + anchor);
  }

  const pn = /\n    passiveName:\[[^\]]*\],/.exec(s);
  if (!pn) throw new Error(r.key + " : passiveName introuvable");
  const apres = pn.index + pn[0].length;
  s = s.slice(0, apres) + "\n" + r.l10n + "\n" + r.rows + s.slice(apres);

  if (r.menu) {
    const a = '      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},';
    if (!s.includes(a)) throw new Error(r.key + " : entrée d'attaque introuvable");
    s = s.replace(a, a + "\n" + r.menu);
  }
  if (r.step) {
    const a = "      const {A, hp, cur} = c, out = {parts:[]};";
    if (!s.includes(a)) throw new Error(r.key + " : onStep introuvable");
    s = s.replace(a, a + "\n" + r.step);
  }

  /* la liste « à relire » du généré parlait du passif : elle est traitée */
  s = s.replace(/\n\/\* -{10,}\n   A RELIRE[\s\S]*?-{10,} \*\/\n?/,
    "\n/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */\n");

  fs.writeFileSync(dst, s);
  const mod = loadSrc(s);                 /* il se charge, au moins */
  if (!mod || mod.key !== r.key) throw new Error(r.key + " : le module ne s'évalue pas");
  return dst;
}

/* ------------------------------------------------------------------ */

const fichier = process.argv[2];
if (!fichier) { console.log("usage : node tools/add-passive.js <recette.json>"); process.exit(1); }
const recettes = JSON.parse(fs.readFileSync(fichier, "utf8"));
let n = 0;
for (const r of Array.isArray(recettes) ? recettes : [recettes]) {
  try { console.log("  écrit  " + path.relative(ROOT, pose(r))); n++; }
  catch (e) { console.log("  RATE   " + r.key + " : " + e.message); }
}
console.log(n + " module(s) publié(s) dans champions/");
