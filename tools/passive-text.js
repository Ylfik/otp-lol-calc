/* Le passif d'un champion, tel que le wiki l'écrit.
 *
 * Le générateur ne sait pas lire les passifs : le wiki met leurs chiffres
 * dans la prose plutôt que dans ses lignes de données. Cet outil sort
 * cette prose, nettoyée de ses modèles, pour qu'on écrive le passif à la
 * main sans rouvrir le wiki — et surtout sans l'écrire de mémoire.
 *
 *   node tools/passive-text.js Lux Ezreal Brand
 *   node tools/passive-text.js --raw Lux        (le wikitexte tel quel)
 */

const fs = require("fs");
const path = require("path");

const DIR = path.join(path.dirname(__dirname), "data", "champions");
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

function fileFor(name) {
  const want = norm(name);
  for (const f of fs.readdirSync(DIR)) if (norm(f) === want) return path.join(DIR, f);
  return null;
}

/* Le premier bloc {{Ability data}} est le passif. On s'arrête au suivant. */
function passiveBlock(text) {
  const starts = [];
  const re = /\{\{\{\{\{1<noinclude>/g;
  let m;
  while ((m = re.exec(text))) starts.push(m.index);
  if (!starts.length) return text.slice(0, 4000);
  return text.slice(starts[0], starts[1] === undefined ? text.length : starts[1]);
}

function field(block, key) {
  const re = new RegExp("^\\|\\s*" + key + "\\s*=([\\s\\S]*?)(?=^\\|\\s*[a-zA-Z0-9]+\\s*=|^\\}\\})", "m");
  const m = re.exec(block);
  return m ? m[1].trim() : "";
}

/* Les modèles du wiki, ramenés à ce qu'ils veulent dire. On garde
   {{pplevel}} tel quel : c'est une interpolation par niveau, et c'est
   précisément l'information à reporter dans le module. */
/* les premiers morceaux d'un modèle sont souvent sa clé d'affichage, pas
   son texte : {{sti|as|10% attack speed}} ne veut pas dire « as » */
const CLE = /^(key=|color=|formula=|as|ah|ap|ad|cd|hp|mr|ar|ms|range|lvl|heal|shield|true|magic|physical)$/i;

function plain(s) {
  let t = String(s);
  /* {{pplevel}} d'abord, mais seulement une fois ses propres imbrications
     résolues — sinon le marqueur avale la suite de la phrase */
  for (let i = 0; i < 6; i++) {
    const avant = t;
    t = t.replace(/\{\{pplevel\|([^{}]*)\}\}/g,
      (_, v) => "«par niveau: " + v.replace(/\|?(key|color|formula)=[^|]*/g, "").replace(/^\|/, "") + "»");
    if (t === avant) break;
  }
  /* de l'intérieur vers l'extérieur : un modèle imbriqué porte souvent la
     valeur, et l'effacer en bloc laisse une phrase sans son chiffre */
  for (let i = 0; i < 10; i++) {
    const avant = t;
    t = t.replace(/\{\{([a-zA-Z#][^{}]*)\}\}/g, (tout, dedans) => {
      if (/^#var:/.test(dedans)) return "<var:" + dedans.slice(5) + ">";
      const bouts = dedans.split("|").slice(1)        /* sans le nom du modèle */
        .filter(b => b.trim() && !/^(key|color|formula)=/.test(b.trim()));
      if (!bouts.length) return "";
      /* un chiffre est ce qu'on vient chercher : s'il y en a un, c'est
         lui le morceau utile, quelle que soit sa place */
      const chiffre = bouts.find(b => /\d/.test(b));
      if (chiffre) return chiffre;
      const mot = bouts.find(b => !CLE.test(b.trim()));
      return mot === undefined ? bouts[0] : mot;
    });
    if (t === avant) break;
  }
  return t
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/'''|''/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const args = process.argv.slice(2);
const raw = args.includes("--raw");
const names = args.filter(a => a !== "--raw");
if (!names.length) {
  console.log("usage : node tools/passive-text.js <Champion> [...]   (--raw pour le wikitexte)");
  process.exit(1);
}

for (const name of names) {
  const f = fileFor(name);
  console.log("\n######## " + name + (f ? "" : "  — INTROUVABLE dans data/champions/"));
  if (!f) continue;
  const block = passiveBlock(fs.readFileSync(f, "utf8"));
  if (raw) { console.log(block.slice(0, 4000)); continue; }

  const titre = /\}\}\}\|([^|{}\n]+)\|/.exec(block);
  console.log("passif    : " + (titre ? titre[1].trim() : "?"));
  const type = field(block, "damagetype");
  if (type) console.log("type      : " + type);
  const stat = field(block, "static");
  if (stat) console.log("statique  : " + plain(stat));
  for (const k of ["description", "description2", "description3"]) {
    const v = field(block, k);
    if (v) console.log(k + " :\n  " + plain(v).split("\n").join("\n  "));
  }
}
