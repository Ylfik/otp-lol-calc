/* Proves the parser against the champions that were modelled by hand.

   Those sixteen modules were checked against the game over many rounds of
   corrections, so their `ranks` tables are the closest thing to a known
   answer. For each per-rank table in a module, this looks for the same run
   of numbers somewhere in the parsed wiki data. A table that cannot be
   found is either a parser gap or a wrong number in the module — both are
   worth knowing, so both are printed.

   Usage: node tools/check-abilities.js          summary
          node tools/check-abilities.js -v       list every table          */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PARSED = path.join(ROOT, "data", "abilities");

/* which module file corresponds to which wiki data file */
const PAIRS = {
  "udyr.js": "Udyr", "ekko.js": "Ekko", "elise.js": "Elise", "irelia.js": "Irelia",
  "shen.js": "Shen", "tahmkench.js": "Tahm Kench", "zeri.js": "Zeri", "yunara.js": "Yunara",
  "kayle.js": "Kayle", "chogath.js": "Cho'Gath", "lillia.js": "Lilia",
  "mordekaiser.js": "Mordekaiser", "xinzhao.js": "Xin Zhao", "thresh.js": "Thresh",
  "kindred.js": "Kindred", "twitch.js": "Twitch"
};

const near = (a, b) => Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.002);

/* every per-rank series the parser found for this champion, in any role:
   a value, a ratio that climbs with rank, a cooldown or a cost */
function parsedSeries(champFile){
  const c = JSON.parse(fs.readFileSync(path.join(PARSED, champFile + ".json"), "utf8"));
  const out = [];
  /* a scalar counts as a series that never changes: the wiki writes a flat
     cooldown as "3", while a module may hold it as [3,3,3,3,3] */
  const add = (v, where) => {
    if(Array.isArray(v) && v.length > 1) out.push({ arr: v, where });
    else if(typeof v === "number" && Number.isFinite(v))
      out.push({ arr: [v, v, v, v, v, v], where: where + " (constant)" });
  };
  for(const a of c.abilities){
    add(a.cooldown, `${a.name} cooldown`);
    add(a.cost, `${a.name} cost`);
    for(const r of a.leveling){
      add(r.perRank, `${a.name} / ${r.label}`);
      for(const x of r.ratios) add(x.perRank, `${a.name} / ${r.label} (+${x.stat})`);
    }
  }
  return out;
}

/* the numeric arrays written into a module's ranks:{...} block */
function moduleTables(file){
  const src = fs.readFileSync(path.join(ROOT, "champions", file), "utf8");
  const at = src.indexOf("ranks:{");
  if(at < 0) return [];
  let i = at + "ranks:".length, depth = 0, body = "";
  for(; i < src.length; i++){
    if(src[i] === "{") depth++;
    if(src[i] === "}"){ depth--; if(!depth){ break; } }
    body += src[i];
  }
  const out = [];
  const re = /([A-Za-z0-9_]+)\s*:\s*\[([^\]]*)\]/g;
  let m;
  while((m = re.exec(body))){
    const nums = m[2].split(",").map(s => parseFloat(s.trim()));
    if(nums.length > 1 && nums.every(Number.isFinite)) out.push({ key: m[1], arr: nums });
  }
  return out;
}

/* a module table may be stored scaled: 1.2 for 120%, 0.35 for 35% */
function matches(mod, series){
  const scales = [1, 100, 0.01];
  for(const s of series){
    for(const k of scales){
      if(s.arr.length < mod.length) continue;
      /* allow the module to hold a prefix: five ranks of a six-rank table */
      const head = s.arr.slice(0, mod.length);
      if(head.every((v, i) => near(v * k, mod[i]))) return { where: s.where, scale: k };
      if(s.arr.length === mod.length && s.arr.every((v, i) => near(v * k, mod[i])))
        return { where: s.where, scale: k };
    }
  }
  return null;
}

/* Tables that cannot be found, each one looked at and explained. They are
   listed so that the check passes cleanly and a NEW mismatch stands out
   instead of being lost in noise. Reason matters: "dead" means the module
   declares the table but computes the value another way, so the stale
   numbers are never read. */
const KNOWN = {
  "udyr.js qOnHit":        "table morte : abilities() lit qNewOnHit",
  "shen.js qFlat":         "table morte : abilities() calcule lerp(10,40,L,16)",
  "elise.js pOnHit":       "valeur ecrite dans la description, pas dans leveling",
  "elise.js pHeal":        "valeur ecrite dans la description, pas dans leveling",
  "elise.js spiderCap":    "valeur ecrite dans la description, pas dans leveling",
  "mordekaiser.js qIso":   "stocke en multiplicateur (1.3) la ou le wiki ecrit +30%",
  "mordekaiser.js rCd":    "DESACCORD REEL : module 140/130/120, wiki 140/120/100, Riot 120/110/100"
};

const verbose = process.argv.includes("-v");
let found = 0, missing = [], known = [];

for(const [file, champ] of Object.entries(PAIRS)){
  if(!fs.existsSync(path.join(PARSED, champ + ".json"))){ missing.push(`${file}: donnees wiki absentes`); continue; }
  const series = parsedSeries(champ);
  for(const t of moduleTables(file)){
    const hit = matches(t.arr, series);
    if(hit){
      found++;
      if(verbose) console.log(`  ok   ${file} ${t.key} -> ${hit.where}${hit.scale !== 1 ? " (x" + hit.scale + ")" : ""}`);
    } else if(KNOWN[`${file} ${t.key}`]){
      known.push(`${file} ${t.key} — ${KNOWN[`${file} ${t.key}`]}`);
    } else {
      missing.push(`${file} ${t.key} = [${t.arr.join(", ")}] introuvable dans les donnees wiki`);
    }
  }
}

console.log(`tables retrouvees dans les donnees wiki : ${found}`);
console.log(`ecarts connus et expliques : ${known.length}`);
known.forEach(m => console.log("  " + m));
console.log(`ecarts NOUVEAUX : ${missing.length}`);
missing.forEach(m => console.log("  " + m));
process.exitCode = missing.length ? 1 : 0;
