/* Ecrit un module champions/<nom>.js a partir des donnees deja verifiees.

   Les seize modules ecrits a la main sont la reference : ce generateur ne fait
   que remonter, pour les 159 autres champions, la meme forme de module depuis
   data/abilities/<Nom>.json (le wiki converti par tools/parse-abilities.js)
   et data/champion-base.json (stats de base et noms EN/FR verifies).

   Regle qui commande tout le fichier : aucun chiffre n'est invente. Chaque
   nombre ecrit dans le module sort de ces deux fichiers. Quand une donnee
   manque ou qu'une lecture est ambigue, le champ reste a 0 et un commentaire
   TODO le dit, en clair, dans le module genere. Un module genere n'est donc
   pas un module fini : c'est un brouillon fidele, a relire par un humain.

   Usage : node tools/generate-module.js --out generated          tous
           node tools/generate-module.js --out /tmp/gen Zeri Kayle un ou deux
           node tools/generate-module.js --list                   ce qui existe

   Le nom passe en argument est celui de data/abilities (ex. "Cho'Gath"), ou
   la cle du module (ex. "chogath").                                        */

const fs = require("fs");
const path = require("path");

const ROOT   = path.join(__dirname, "..");
const PARSED = path.join(ROOT, "data", "abilities");
const BASE   = path.join(ROOT, "data", "champion-base.json");
const INDEX  = path.join(ROOT, "index.html");

/* ------------------------------------------------------------------
   1. Les trois sources, et la facon de les faire correspondre
   ------------------------------------------------------------------ */

/* Les noms de fichiers du wiki ne collent pas toujours a ceux de
   champion-base.json. Ces quatre cas sont les seuls, et ils sont ecrits ici
   plutot que devines. */
const FILE_ALIAS = {
  "Lillia": "Lilia",
  "Nunu & Willump": "Nunu"
  /* "Mega Gnar" et "Kled & Skaarl" n'ont pas de fichier wiki propre : ce sont
     des formes, traitees avec le champion de base. "Rhaast" et
     "Shadow Assassin" sont les formes de Kayn, "Mega Gnar" celle de Gnar :
     fichiers wiki sans entree dans champion-base, donc ignores ici. */
};

const base = JSON.parse(fs.readFileSync(BASE, "utf8"));

/* Le ROSTER d'index.html donne la cle, le nom de fichier et le libelle
   affiche de chaque champion. On le lit, on n'y touche pas. */
function roster(){
  const src = fs.readFileSync(INDEX, "utf8");
  const at  = src.indexOf("const ROSTER = [");
  const end = src.indexOf("\n];", at);
  const out = [];
  const re = /\{key:"([^"]+)",\s*name:"([^"]+)"(?:,\s*label:"([^"]*)")?/g;
  let m;
  const body = src.slice(at, end);
  while((m = re.exec(body))) out.push({ key: m[1], name: m[2], label: m[3] || m[2] });
  return out;
}

const ROSTER = roster();
/* Plusieurs entrees de champion-base peuvent porter le meme apiname : "Kled"
   et "Kled & Skaarl", "Gnar" et "Mega Gnar". On retient celle qui a un
   fichier de donnees wiki, c'est la seule exploitable. */
const byApi = {};
for(const k of Object.keys(base)){
  const api = String(base[k].apiname || k).toLowerCase();
  const file = FILE_ALIAS[k] || k;
  const usable = fs.existsSync(path.join(PARSED, file + ".json"));
  if(!byApi[api] || usable) byApi[api] = k;
}

/* la liste de travail : un champion = une entree ROSTER + une entree
   champion-base + un fichier d'abilities */
function targets(){
  const out = [];
  for(const r of ROSTER){
    const bk = byApi[r.name.toLowerCase()];
    if(!bk) continue;                                  /* pas de stats de base */
    const file = FILE_ALIAS[bk] || bk;
    if(!fs.existsSync(path.join(PARSED, file + ".json"))) continue;
    out.push({ ...r, baseKey: bk, file });
  }
  return out;
}

/* ------------------------------------------------------------------
   2. Lecture d'une ligne de leveling
   ------------------------------------------------------------------ */

/* Lignes que le modele n'affiche pas : elles valent pour les sbires, les
   monstres, les tourelles, un tick isole ou un coup critique deja compte
   ailleurs. Elles sont listees en TODO dans le module plutot que jetees. */
const SKIP = /minion|monster|turret|epic|plant|ward|clone|critical\s+strike|infinity\s+edge|non-?champion|capped|mana\s+restor|mana\s+refund|energy|cost|life\s+steal|omnivamp|experience|gold|cooldown\s+re|reduced\s+damage|damage\s+reduction|resistance|armor\s+reduction|armor\s+penetration|bonus\s+armor|magic\s+resist|tenacity|range|duration\s+of|per\s+tick|per\s+second|per\s+hit|per\s+bolt|per\s+missile|per\s+blade|per\s+dagger|per\s+orb|per\s+wave|per\s+pulse/i;

/* Les durees d'effet se reconnaissent avant les ralentissements, sinon
   "Slow Duration" serait lu comme un ralentissement. */
const KIND = [
  ["cc",     /(stun|root|slow|disable|charm|taunt|fear|flee|sleep|drowsy|silence|suppress|knock|airborne|immobiliz|cripple|ground|blind|polymorph|berserk|nearsight|effect|stasis)\s+duration/i],
  ["pen",    /magic\s+penetration/i],
  ["inc",    /damage\s+increase/i],
  ["shield", /shield/i],
  ["heal",   /\bheal\b|\bhealing\b|health\s+restor/i],
  ["slow",   /slow/i],
  ["as",     /attack\s+speed/i],
  ["ms",     /move(ment)?\s+speed/i],
  ["damage", /damage/i]
];

/* Un prefixe de libelle dit de quelle variante il s'agit. "Total" vaut
   souvent pour la somme des coups d'un meme sort, "Minimum"/"Maximum" pour
   une charge, "per Stack" pour un compteur. */
const VARIANT = [
  ["PerStack", /per\s+(stack|mark|soul|charge|damnation|bloodline|chain|fury|stone|ball)/i],
  ["Min",      /^(minimum|initial|base)\b/i],
  ["Max",      /^(maximum|fully|enhanced|increased|empowered)\b/i],
  ["Total",    /^total\b/i],
  ["",         /.*/]
];

/* Le mot qui distingue deux lignes du meme genre : "Thrust Physical Damage"
   contre "Slash Total Physical Damage" donne Thrust et Slash. */
const GENERIC = /^(total|physical|magic|magical|true|mixed|damage|bonus|base|minimum|maximum|initial|increased|enhanced|additional|champion|per|the|of|and|to|a|single)$/i;
function tag(label){
  const w = String(label).replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(x => x && !GENERIC.test(x));
  if(!w.length) return "";
  return w[0][0].toUpperCase() + w[0].slice(1).toLowerCase();
}

function classify(row){
  const lab = row.label || "";
  if(SKIP.test(lab)) return null;
  /* "par coup", "par salve", "par tick" : une fraction d'un total que le wiki
     donne par ailleurs. Seuls les "par charge" comptent, ils dependent d'un
     compteur. */
  if(/\bper\b/i.test(lab) && !/per\s+(stack|mark|soul|charge|damnation|bloodline|fury|stone|ball)/i.test(lab)) return null;
  let kind = null;
  for(const [k, re] of KIND) if(re.test(lab)){ kind = k; break; }
  if(!kind) return null;
  let variant = "";
  for(const [v, re] of VARIANT) if(re.test(lab)){ variant = v; break; }
  return { kind, variant, label: lab };
}

/* Le type de degats, lu d'abord sur la ligne — "Magic Damage" est sans
   ambiguite — et seulement ensuite sur la competence, dont le champ melange
   les deux quand un sort fait les deux ("Physical Magic"). */
function dmgType(row, ability){
  const lab = row.label || "";
  if(/true/i.test(lab))     return "true";
  if(/magic/i.test(lab))    return "magic";
  if(/physical/i.test(lab)) return "phys";
  const d = ability.damageType || "";
  if(/^\s*true/i.test(d))     return "true";
  if(/^\s*physical/i.test(d)) return "phys";
  return "magic";
}

/* Ce que la valeur principale de la ligne mesure. Le wiki l'ecrit en clair
   dans le texte, une fois les groupes "(+ ...)" retires : "8 to 10% of
   target's missing health", "9 to 13% AD", "30 to 50%". */
function mainUnit(row){
  const rest = String(row.text || "").replace(/\([^()]*(?:\([^()]*\)[^()]*)*\)/g, " ");
  if(/target'?s?\s+maximum\s+health/i.test(rest))  return "targetMaxHp";
  if(/target'?s?\s+current\s+health/i.test(rest))  return "targetCurHp";
  if(/target'?s?\s+missing\s+health/i.test(rest))  return "targetMissHp";
  if(/%\s*(total\s+)?(AD|attack\s+damage)/i.test(rest)) return "pctAD";
  if(/%\s*bonus\s+(AD|attack\s+damage)/i.test(rest))    return "pctBonusAD";
  if(/%\s*AP/i.test(rest))                              return "pctAP";
  if(/(his|her|their|its)\s+(maximum|bonus)\s+health/i.test(rest)) return "pctOwnHp";
  return "flat";
}

/* Un ratio "(+ 35% AP)" devient un coefficient dans ranks{} et un terme dans
   abilities(). Le suffixe nomme le coefficient, le facteur dit comment la
   valeur du wiki est stockee, et `term` comment elle est relue. */
const RATIO = {
  ad:               { sfx: "AD",        div: 100, term: "tot.ad" },
  totalAD:          { sfx: "AD",        div: 100, term: "tot.ad" },
  bonusAD:          { sfx: "BonusAD",   div: 100, term: "bonusAD" },
  ap:               { sfx: "AP",        div: 100, term: "ap" },
  per100AP:         { sfx: "AP100",     div: 1,   term: "ap/100" },
  per100BonusAD:    { sfx: "BonusAD100",div: 1,   term: "bonusAD/100" },
  bonusHealth:      { sfx: "BonusHp",   div: 100, term: "bonusHP" },
  per100BonusHealth:{ sfx: "BonusHp100",div: 1,   term: "bonusHP/100" },
  per100MaxHealth:  { sfx: "MaxHp100",  div: 1,   term: "tot.hp/100" },
  maxHealth:        { sfx: "MaxHp",     div: 100, term: "tot.hp" },
  maxMana:          { sfx: "MaxMana",   div: 100, term: "tot.mana" },
  armor:            { sfx: "Armor",     div: 100, term: "tot.ar" },
  mr:               { sfx: "Mr",        div: 100, term: "tot.mr" }
};

/* Les ratios en part de vie de la CIBLE ne se calculent pas dans abilities()
   — la vie de la cible n'y est pas connue — mais dans onStep. Le wiki le dit
   explicitement ("of target's maximum health") ; sans ce mot, la part de vie
   est celle du champion, et elle passe par RATIO ci-dessus. */
const TARGET_HP = {
  targetMaxHealth:     { sfx: "HpPct",   step: "hp" },
  targetCurrentHealth: { sfx: "CurPct",  step: "cur" },
  targetMissingHealth: { sfx: "MissPct", step: "Math.max(0, hp - cur)" }
};

/* La vie courante ou manquante DU CHAMPION : le moteur ne suit que ses PV
   max, donc la valeur reste un pourcentage affiche, comme dans les modules
   ecrits a la main (le Q de Tahm Kench). */
const OWN_PART = { currentHealth: "CurPct", missingHealth: "MissPct" };

/* Le parseur nomme per100AP un groupe qui est en fait une part de vie de la
   cible avec un bonus par 100 AP dedans : "2 to 4% (+ 1.5% per 100 AP) of
   target's maximum health". Le texte brut tranche. */
function ratioStat(r){
  const raw = String(r.raw || "");
  if(/target'?s?\s+maximum\s+health/i.test(raw))  return "targetMaxHealth";
  if(/target'?s?\s+current\s+health/i.test(raw))  return "targetCurrentHealth";
  if(/target'?s?\s+missing\s+health/i.test(raw))  return "targetMissingHealth";
  return r.stat;
}

/* ------------------------------------------------------------------
   3. Construction du modele d'un champion
   ------------------------------------------------------------------ */

const SLOTS = ["Q", "W", "E", "R"];
const num = v => {
  const r = Math.round(v * 1e6) / 1e6;
  return Number.isFinite(r) ? String(r) : "0";
};
const arr = a => "[" + a.map(num).join(",") + "]";

/* le nom d'un effet, en camelCase, pour la ligne du detail de combo */
function camel(s){
  const w = String(s).replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
  return w.map((x, i) => i ? x[0].toUpperCase() + x.slice(1).toLowerCase() : x.toLowerCase()).join("");
}

function build(t){
  const data = JSON.parse(fs.readFileSync(path.join(PARSED, t.file + ".json"), "utf8"));
  const names = (base[t.baseKey].names || {});
  const todo = [];                       /* ce que le generateur n'a pas su lire */
  const ranks = [];                      /* [cle, texte] dans l'ordre d'ecriture */
  /* Deux lignes d'une meme competence peuvent viser le meme nom de table. La
     meme valeur est alors partagee, une valeur differente prend un nom libre :
     ecraser silencieusement une table ferait dire au module un chiffre qui
     n'est pas le sien. */
  const putRank = (k, v) => {
    const same = ranks.find(([kk, vv]) => kk === k && vv === v);
    if(same) return k;
    let k2 = k, n = 2;
    while(ranks.some(([kk]) => kk === k2)) k2 = k + (n++);
    ranks.push([k2, v]);
    return k2;
  };

  /* --- competences, par slot, premiere forme seulement --- */
  const bySlot = {};
  for(const a of data.abilities){
    const s = String(a.slot || "").trim().toUpperCase();
    if(s === "I"){ (bySlot.I = bySlot.I || []).push(a); continue; }
    if(!SLOTS.includes(s)) { if(a.name) todo.push(`slot non reconnu « ${s} » pour ${a.name}`); continue; }
    (bySlot[s] = bySlot[s] || []).push(a);
  }
  for(const s of SLOTS){
    const list = bySlot[s] || [];
    if(list.length > 1)
      todo.push(`${s} : ${list.length} formes dans le wiki (${list.map(a => a.name).join(", ")}) — seule la premiere est modelisee`);
  }

  /* --- noms officiels : champion-base d'abord, le wiki ne sert qu'a verifier --- */
  const spells = (names.spells || []);
  const meta = SLOTS.map((s, i) => {
    const n = spells[i];
    const wiki = (bySlot[s] || [])[0];
    if(!n) todo.push(`${s} : nom FR absent de champion-base.json`);
    return { k: s.toLowerCase(), en: n ? n.en : (wiki ? wiki.name : ""), fr: n ? n.fr : "" };
  });

  /* --- valeurs, slot par slot --- */
  const out = [];        /* lignes de abilities() */
  const zero = {};       /* A.x a remettre a 0 si la competence n'est pas prise */
  const rowsFor = {};    /* lignes d'affichage par slot */
  let sixRank = false;

  for(const s of SLOTS){
    const a = (bySlot[s] || [])[0];
    const low = s.toLowerCase();
    const rv  = low + "r";                              /* qr, wr, er, rr */
    rowsFor[low] = [];
    if(!a){ todo.push(`${s} : aucune competence dans les donnees wiki`); continue; }

    /* Certaines competences n'ont pas de ligne de degats « nue » : le wiki
       n'ecrit que "Total Magic Damage" (un sort qui touche plusieurs fois) ou
       "Minimum Physical Damage". La premiere ligne de degats devient alors la
       ligne principale, sinon le sort ne ferait aucun degat dans le module. */
    const cls = a.leveling.map(row => ({ row, cl: classify(row) }));
    const hasBaseDmg = cls.some(x => x.cl && x.cl.kind === "damage" && x.cl.variant === "");
    const promoted = hasBaseDmg ? null : (cls.find(x => x.cl && x.cl.kind === "damage") || {}).row;
    if(promoted) todo.push(`${s} : pas de ligne de degats simple, « ${promoted.label} » prise comme ligne principale`);

    /* le libelle de rang sert aussi a reperer les kits a six rangs (Udyr) */
    const seen = {};
    const incs = [];      /* "+30% si la cible est isolee" : lu apres les degats */
    for(const row of a.leveling){
      if(Array.isArray(row.perRank) && row.perRank.length === 6) sixRank = true;
      const cl = classify(row);
      if(!cl){ if(row.label) todo.push(`${s} / ${row.label} : ligne non modelisee (${row.text || ""})`); continue; }
      if(row === promoted) cl.variant = "";

      const unit0 = mainUnit(row);
      /* Une competence peut porter deux lignes du meme genre et de la meme
         variante : le coup et l'estoc de Xin Zhao, les degats fixes et la part
         de vie manquante de Kayle. Elles se distinguent par leur unite, sinon
         par le mot qui les nomme dans le wiki. */
      if(seen[cl.kind + cl.variant + unit0]){
        const w = tag(row.label);
        if(w && !seen[cl.kind + w + unit0]) cl.variant = w;
        else {
          todo.push(`${s} / ${row.label} : doublon de ${seen[cl.kind + cl.variant + unit0]}, ignore`);
          continue;
        }
      }
      seen[cl.kind + cl.variant + unit0] = row.label;

      const nameOf = { damage: "", heal: "Heal", shield: "Shield", slow: "Slow",
                       as: "AS", ms: "Ms", cc: "Cc", pen: "Pen", inc: "IncPct" }[cl.kind];
      const fieldBase = low + (cl.kind === "damage" ? (cl.variant || "Flat") : nameOf + cl.variant);
      const aKey = low + (cl.kind === "damage" ? (cl.variant || "Dmg") : nameOf + cl.variant);
      /* les coefficients se nomment d'apres le slot, pas d'apres la table :
         qAD, qAP comme dans les modules ecrits a la main */
      const coefBase = low + (cl.kind === "damage" ? cl.variant : nameOf + cl.variant);

      const unit = unit0;
      const terms = [];
      let pctField = null;                 /* part de vie de la cible, lue dans onStep */

      /* valeur principale */
      let mainKey = null;
      if(Array.isArray(row.perRank) && row.perRank.length > 1){
        mainKey = putRank(fieldBase, arr(row.perRank));
        terms.push(`R(T.${mainKey},${rv})`);
      } else if(Array.isArray(row.perRank) && row.perRank.length === 1){
        mainKey = putRank(fieldBase, num(row.perRank[0]));
        terms.push(`T.${mainKey}`);
      } else if(row.perLevel){
        const p = row.perLevel;
        if(p.kind === "flat") terms.push(num(p.at1));
        else if(p.steps) terms.push(`lerp(${num(p.at1)},${num(p.at18)},L,16)`);
        else terms.push(`lerp(${num(p.at1)},${num(p.at18)},L)`);
        if(p.steps) todo.push(`${s} / ${row.label} : progression par paliers (${p.steps}) approximee par une interpolation du niveau 1 au 16`);
      } else if(typeof row.flat === "number"){
        mainKey = putRank(fieldBase, num(row.flat));
        terms.push(`T.${mainKey}`);
      } else if(!row.ratios.length){
        todo.push(`${s} / ${row.label} : aucune valeur lisible (${row.text || ""})`);
        terms.push("0 /* TODO: valeur absente des donnees */");
      }

      /* unite de cette valeur principale — rien a transformer si le wiki n'a
         donne aucune valeur principale (tout est alors dans les ratios) */
      if(terms.length){
      if(unit === "pctAD")       terms[0] = `(${terms[0]})/100*tot.ad`;
      if(unit === "pctBonusAD")  terms[0] = `(${terms[0]})/100*bonusAD`;
      if(unit === "pctAP")       terms[0] = `(${terms[0]})/100*ap`;
      if(unit === "pctOwnHp")    terms[0] = `(${terms[0]})/100*tot.hp`;
      }
      if(unit === "targetMaxHp" || unit === "targetCurHp" || unit === "targetMissHp"){
        /* la valeur est un pourcentage de la vie de la cible : elle sort de
           abilities() comme un pourcentage, et onStep la multiplie */
        pctField = unit === "targetMaxHp"  ? { sfx: "HpPct",   step: "hp" }
                 : unit === "targetCurHp"  ? { sfx: "CurPct",  step: "cur" }
                 :                           { sfx: "MissPct", step: "Math.max(0, hp - cur)" };
      }

      /* Le wiki ecrit entre crochets l'effet d'une AUTRE competence ajoute a
         celle-ci ("+ [ An Acquired Taste ... ]"). Ces ratios appartiennent a
         l'autre competence : les compter ici doublerait les degats. */
      const brk = String(row.text || "").indexOf("[");
      /* ratios */
      for(const r of row.ratios){
        if(brk >= 0 && String(row.text).indexOf(String(r.raw)) > brk){
          todo.push(`${s} / ${row.label} : « ${r.raw} » appartient a un autre effet (crochets du wiki), non compte ici`);
          continue;
        }
        const stat = ratioStat(r);
        const val  = r.perRank && r.perRank.length > 1 ? r.perRank
                   : r.perRank ? r.perRank[0]
                   : r.perLevel ? r.perLevel
                   : r.pct;
        if(stat === null || stat === undefined){
          /* Un groupe "(+ 80 to 220)" ne nomme aucune statistique : c'est un
             terme fixe, que le wiki a simplement ecrit a part (le Q de
             Mordekaiser). Tout ce qui n'est pas purement numerique reste en
             TODO plutot que d'etre range de force. */
          if(/^[\d.,\s]+(to\s+[\d.,\s]+)?$/i.test(String(r.raw).trim())){
            const k = putRank(coefBase + "Add", Array.isArray(val) ? arr(val) : num(val && val.kind ? val.at1 : val));
            terms.push(Array.isArray(val) ? `R(T.${k},${rv})` : `T.${k}`);
          } else todo.push(`${s} / ${row.label} : ratio sans statistique « ${r.raw} » non modelise`);
          continue;
        }
        if(TARGET_HP[stat]){
          const d = TARGET_HP[stat];
          let k = coefBase + d.sfx;
          if(Array.isArray(val)) k = putRank(k, arr(val));
          else if(val && val.kind) { k = putRank(k, num(val.at1)); todo.push(`${s} / ${row.label} : part de vie de la cible qui monte avec le niveau, lue au niveau 1`); }
          else k = putRank(k, num(val));
          let expr = Array.isArray(val) ? `R(T.${k},${rv})` : `T.${k}`;
          /* Le wiki glisse un "(+ 3% per 100 AP)" DANS le groupe en part de
             vie de la cible : "4% (+ 3% per 100 AP) of target's current
             health". Le parseur ne garde que le texte, donc le coefficient se
             lit ici, sur la chaine, sans rien ajouter d'autre. */
          const inner = /([0-9.]+)\s*%?\s*per\s+100\s+AP/i.exec(String(r.raw));
          if(inner){
            const ik = putRank(k + "AP100", num(parseFloat(inner[1])));
            expr += ` + T.${ik}*ap/100`;
          }
          const pk = coefBase + d.sfx[0].toUpperCase() + d.sfx.slice(1);
          out.push({ a: pk, expr, slot: low, kindTag: "pct", stepMul: d.step,
                     label: row.label, variant: cl.variant,
                     dmg: cl.kind === "damage" ? dmgType(row, a) : null });
          zero[low] = (zero[low] || []).concat(pk);
          rowsFor[low].push({ aKey: pk, kind: "pct", label: row.label });
          if(/per\s+(stack|mark|soul|charge)/i.test(String(r.raw)))
            todo.push(`${s} / ${row.label} : bonus par charge dans « ${r.raw} » non modelise`);
          continue;
        }
        if(OWN_PART[stat]){
          const k = putRank(coefBase + OWN_PART[stat], Array.isArray(val) ? arr(val) : num(val && val.kind ? val.at1 : val));
          const ak = coefBase + OWN_PART[stat];
          out.push({ a: ak, expr: Array.isArray(val) ? `R(T.${k},${rv})` : `T.${k}`, slot: low,
                     kindTag: "own", label: row.label, variant: cl.variant });
          zero[low] = (zero[low] || []).concat(ak);
          rowsFor[low].push({ aKey: ak, kind: "own", label: row.label });
          todo.push(`${s} / ${row.label} : « ${r.raw} » est une part des PV du champion — le moteur ne suit pas ses PV courants, la valeur reste un pourcentage affiche`);
          continue;
        }
        const def = RATIO[stat];
        if(!def){
          todo.push(`${s} / ${row.label} : ratio « ${r.raw} » (${stat}) non modelise`);
          continue;
        }
        if(stat === "armor" || stat === "mr")
          todo.push(`${s} / ${row.label} : « ${r.raw} » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours`);
        const k0 = coefBase + def.sfx;
        if(Array.isArray(val)){
          const k = putRank(k0, arr(val.map(v => v / def.div)));
          terms.push(`R(T.${k},${rv})*${def.term}`);
        } else if(val && val.kind){
          terms.push(`lerp(${num(val.at1 / def.div)},${num(val.at18 / def.div)},L)*${def.term}`);
        } else {
          const k = putRank(k0, num(val / def.div));
          terms.push(`T.${k}*${def.term}`);
        }
      }

      if(pctField){
        /* La valeur principale de la ligne est elle-meme un pourcentage de la
           vie de la cible : la table prend le nom qui le dit, et onStep la
           multiplie par la vie de la cible. */
        const ak = coefBase + pctField.sfx;
        let k = ak;
        const own = mainKey ? ranks.find(([kk]) => kk === mainKey) : null;
        if(own){ k = ranks.some(([kk]) => kk === ak) ? ak + "2" : ak; own[0] = k; }
        out.push({ a: ak, expr: terms.join(" + ").replace(new RegExp("T\\." + mainKey + "\\b", "g"), "T." + k),
                   slot: low, kindTag: "pct", stepMul: pctField.step, label: row.label,
                   variant: cl.variant, dmg: cl.kind === "damage" ? dmgType(row, a) : null });
        zero[low] = (zero[low] || []).concat(ak);
        rowsFor[low].push({ aKey: ak, kind: "pct", label: row.label });
        continue;
      }

      if(!terms.length) continue;
      if(cl.kind === "inc"){
        /* le wiki l'ecrit en pourcentage des degats de la competence */
        incs.push({ pct: terms.join(" + "), variant: cl.variant, label: row.label, dmg: dmgType(row, a) });
        continue;
      }
      out.push({ a: aKey, expr: terms.join(" + "), slot: low, kindTag: cl.kind,
                 dmg: cl.kind === "damage" ? dmgType(row, a) : null, label: row.label, variant: cl.variant });
      zero[low] = (zero[low] || []).concat(aKey);
      rowsFor[low].push({ aKey, kind: cl.kind, variant: cl.variant, label: row.label });
    }

    for(const inc of incs){
      const dmgKey = (out.find(x => x.slot === low && x.kindTag === "damage" && !x.variant) || {}).a;
      if(!dmgKey){ todo.push(`${s} / ${inc.label} : augmentation sans ligne de degats a augmenter`); continue; }
      const k = low + "Inc" + (inc.variant || "");
      out.push({ a: k, expr: `A.${dmgKey} * (1 + (${inc.pct})/100)`, slot: low, kindTag: "damage",
                 dmg: inc.dmg, label: inc.label, variant: inc.variant || "Inc" });
      zero[low] = (zero[low] || []).concat(k);
      rowsFor[low].push({ aKey: k, kind: "damage", variant: "Inc", label: inc.label });
    }

    /* recharge */
    const cd = a.cooldown;
    const flatCd = v => arr(new Array(s === "R" ? 3 : 5).fill(v));
    if(Array.isArray(cd) && cd.length > 1) putRank(low + "Cd", arr(cd));
    else if(Array.isArray(cd) && cd.length === 1) putRank(low + "Cd", flatCd(cd[0]));
    else if(typeof cd === "number") putRank(low + "Cd", flatCd(cd));
    else if(cd && cd.kind) todo.push(`${s} : recharge qui varie avec le niveau (${cd.at1} a ${cd.at18}) non modelisee`);
    else todo.push(`${s} : aucune recharge dans les donnees wiki`);
  }

  /* --- passif --- */
  const pass = (bySlot.I || [])[0];
  const passRows = [];
  const passValues = [];
  if((bySlot.I || []).length > 1)
    todo.push(`passif : ${bySlot.I.length} blocs dans le wiki (${bySlot.I.map(a => a.name).join(", ")}) — seul le premier est modelise`);
  if(pass){
    const seenP = {};
    for(const row of pass.leveling){
      const cl = classify(row);
      if(!cl){ if(row.label) todo.push(`passif / ${row.label} : ligne non modelisee (${row.text || ""})`); continue; }
      const key = cl.kind + cl.variant;
      if(seenP[key]) continue;
      seenP[key] = 1;
      const nameOf = { damage: "Dmg", heal: "Heal", shield: "Shield", slow: "Slow", as: "AS", ms: "Ms", cc: "Cc" }[cl.kind];
      const aKey = "p" + nameOf + cl.variant;
      const fieldBase = "p" + nameOf + cl.variant;
      const terms = [];
      let pct = null;
      const unit = mainUnit(row);
      if(row.perLevel){
        const p = row.perLevel;
        if(p.kind === "flat") terms.push(num(p.at1));
        else if(p.steps){ terms.push(`lerp(${num(p.at1)},${num(p.at18)},L,16)`);
          todo.push(`passif / ${row.label} : progression par paliers (${p.steps}) approximee par une interpolation du niveau 1 au 16`); }
        else terms.push(`lerp(${num(p.at1)},${num(p.at18)},L)`);
      } else if(Array.isArray(row.perRank) && row.perRank.length > 1){
        putRank(fieldBase, arr(row.perRank));
        terms.push(`R(T.${fieldBase},rr)`);
        todo.push(`passif / ${row.label} : progression par rang — le module la lit au rang du R, a verifier`);
      } else if(Array.isArray(row.perRank)){
        putRank(fieldBase, num(row.perRank[0]));
        terms.push(`T.${fieldBase}`);
      } else if(typeof row.flat === "number"){
        putRank(fieldBase, num(row.flat));
        terms.push(`T.${fieldBase}`);
      } else if(!row.ratios.length){
        todo.push(`passif / ${row.label} : aucune valeur lisible (${row.text || ""})`);
        continue;
      }
      if(terms.length){
        if(unit === "pctAD")      terms[0] = `(${terms[0]})/100*tot.ad`;
        if(unit === "pctBonusAD") terms[0] = `(${terms[0]})/100*bonusAD`;
        if(unit === "pctAP")      terms[0] = `(${terms[0]})/100*ap`;
        if(unit === "pctOwnHp")   terms[0] = `(${terms[0]})/100*tot.hp`;
      }
      if(unit === "targetMaxHp")  pct = "hp";
      if(unit === "targetCurHp")  pct = "cur";
      if(unit === "targetMissHp") pct = "Math.max(0, hp - cur)";
      for(const r of row.ratios){
        const stat = ratioStat(r);
        const val = r.perRank && r.perRank.length > 1 ? r.perRank : r.perRank ? r.perRank[0] : r.perLevel ? r.perLevel : r.pct;
        if(TARGET_HP[stat]){
          const k = "p" + cl.variant + TARGET_HP[stat].sfx;
          putRank(k, Array.isArray(val) ? arr(val) : num(val && val.kind ? val.at1 : val));
          passValues.push({ a: k, expr: Array.isArray(val) ? `R(T.${k},rr)` : `T.${k}`, pct: TARGET_HP[stat].step, label: row.label });
          passRows.push({ aKey: k, kind: "pct", label: row.label });
          continue;
        }
        const def = RATIO[stat];
        if(!def || stat === null || stat === undefined){
          todo.push(`passif / ${row.label} : ratio « ${r.raw} » non modelise`);
          continue;
        }
        const k = fieldBase + def.sfx;
        if(Array.isArray(val)){ putRank(k, arr(val.map(v => v / def.div))); terms.push(`R(T.${k},rr)*${def.term}`); }
        else if(val && val.kind) terms.push(`lerp(${num(val.at1 / def.div)},${num(val.at18 / def.div)},L)*${def.term}`);
        else { putRank(k, num(val / def.div)); terms.push(`T.${k}*${def.term}`); }
      }
      if(!terms.length) continue;
      passValues.push({ a: aKey + (pct ? "Pct" : ""), expr: terms.join(" + "), pct, label: row.label,
                        dmg: cl.kind === "damage" ? dmgType(row, pass) : null, kind: cl.kind });
      passRows.push({ aKey: aKey + (pct ? "Pct" : ""), kind: pct ? "pct" : cl.kind, label: row.label });
    }
  } else todo.push("passif : aucun bloc dans les donnees wiki");
  if(pass && !passValues.length)
    todo.push("passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main");

  /* Une invocation se bat toute seule : le wiki ne chiffre ni ses attaques ni
     sa duree de vie dans le bloc de la competence. */
  for(const s of SLOTS){
    const a = (bySlot[s] || [])[0];
    if(!a) continue;
    if(/summon|tibbers|daisy|voidling|turret|totem|golem|mushroom|clone|spiderling|minion|pet|wolf|ghoul|maiden/i.test(a.name || ""))
      todo.push(`${s} : « ${a.name} » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence`);
  }
  if(sixRank) todo.push("une table a six rangs : ce kit ne suit pas le schema 5/5/5/3, rankCap a revoir");
  if(base[t.baseKey].resource && !/mana|none|manaless/i.test(base[t.baseKey].resource))
    todo.push(`ressource particuliere (${base[t.baseKey].resource}) : non modelisee`);

  return { t, data, names, ranks, out, zero, rowsFor, meta, pass, passRows, passValues, todo, sixRank };
}

/* ------------------------------------------------------------------
   4. Ecriture du module
   ------------------------------------------------------------------ */

/* Les libelles affiches viennent du dictionnaire d'index.html : seules les
   cles generiques sont utilisees, aucune cle n'est ajoutee au site. */
/* les lignes qui s'affichent en pourcentage */
const PCT_ROW = ["pct", "own", "slow", "as", "ms", "pen"];
const LAB = { damage: "damage", heal: "healing", shield: "shield", slow: "slow",
              as: "bonusAs", ms: "msBonus", cc: "comboTime", pct: "mPpct", pen: "mPen",
              own: "sQpct" };

function render(m){
  const { t, ranks, out, zero, rowsFor, meta, passRows, passValues, todo } = m;
  const esc = s => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const L = [];
  const p = s => L.push(s);

  p(`/* ${t.key} — GENERE par tools/generate-module.js, a relire avant mise en ligne.`);
  p(`   Source : data/abilities/${m.t.file}.json + data/champion-base.json.`);
  p(`   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete`);
  p(`   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du`);
  p(`   fichier disent ce que le generateur n'a pas su lire. */`);
  p(`window.CHAMPION = {`);
  p(`    key:"${t.key}", name:"${t.name}", label:"${esc(t.label)}", splash:0,`);

  const b = base[t.baseKey].base;
  p(`    base:{hp:[${b.hp[0]},${b.hp[1]}], mana:[${b.mana[0]},${b.mana[1]}], ad:[${b.ad[0]},${b.ad[1]}],`);
  p(`          ar:[${b.ar[0]},${b.ar[1]}], mr:[${b.mr[0]},${b.mr[1]}],`);
  p(`          as:${b.as}, asPerLevel:${b.asPerLevel}, ms:${b.ms}},`);

  p(`    abilities_meta:[`);
  p(meta.map(x => `      {k:"${x.k}", en:"${esc(x.en)}", fr:"${esc(x.fr)}"}`).join(",\n"));
  p(`    ],`);
  p(`    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),`);
  /* l'ultime s'apprend aux niveaux 6, 11 et 16 — pas au niveau 1. La
     formule precedente (L/5 + 1) le rendait disponible des le premier
     niveau et rang 3 au dixieme : c'est le bug corrige a la main dans
     les seize modules, qui vivait encore ici. */
  p(`    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */`);
  p(`    maxRank: 5,`);

  /* ranks */
  p(`    ranks:{`);
  const lines = [];
  for(const s of ["q", "w", "e", "r", "p"]){
    const mine = ranks.filter(([k]) => k[0] === s && !(s === "p" && /^[qwer]/.test(k)));
    if(!mine.length) continue;
    lines.push("      " + mine.map(([k, v]) => `${k}:${v}`).join(", "));
  }
  p(lines.join(",\n"));
  p(`    },`);

  /* abilities() */
  p(`    abilities(c){`);
  p(`      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;`);
  p(`      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;`);
  p(`      const ap = tot.ap, ah = 1 + tot.ah/100;`);
  for(const s of ["q", "w", "e", "r"]){
    const mine = out.filter(x => x.slot === s);
    if(!mine.length) continue;
    const me = meta.find(x => x.k === s);
    p(`      /* ${s.toUpperCase()} — ${me && me.en ? me.en : ""} */`);
    for(const x of mine) p(`      A.${x.a} = ${x.expr};${x.kindTag === "pct" ? "   /* % des PV de la cible, applique dans onStep */" : ""}`);
  }
  if(passValues.length){
    p(`      /* passif — ${m.pass ? m.pass.name : ""} */`);
    for(const x of passValues) p(`      A.${x.a} = ${x.expr};${x.pct ? "   /* % des PV de la cible, applique dans onStep */" : ""}`);
  }
  const cds = ["q", "w", "e", "r"].filter(s => ranks.some(([k]) => k === s + "Cd"));
  if(cds.length){
    p(`      ${cds.filter(s => s !== "r").map(s => `A.${s}Cd = R(T.${s}Cd,${s}r)/ah;`).join(" ")}`);
    if(cds.includes("r")) p(`      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);`);
  }
  for(const s of ["q", "w", "e", "r"]){
    if(!zero[s] || !zero[s].length) continue;
    p(`      if(!learned.${s}){ ${zero[s].map(k => `A.${k}=0;`).join(" ")} }`);
  }
  p(`      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));`);
  p(`      return A;`);
  p(`    },`);

  /* passif affiche */
  const pn = (m.names.passive || {});
  p(`    passiveName:["${esc(pn.en || (m.pass ? m.pass.name : ""))}","${esc(pn.fr || "")}"],`);
  if(passRows.length){
    p(`    passiveRows(c){`);
    p(`      const {A, TR, n0, pc} = c;`);
    p(`      return [`);
    p(passRows.slice(0, 4).map(r =>
      `        {lab:TR("${LAB[r.kind] || "damage"}"), val:${PCT_ROW.includes(r.kind) ? "pc" : "n0"}(A.${r.aKey})}   /* ${r.label} */`
    ).join(",\n"));
    p(`      ];`);
    p(`    },`);
  }

  /* stepMenu */
  const steps = [];
  steps.push(`      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"}`);
  const passDmg = passValues.filter(x => x.kind === "damage");
  if(passDmg.length)
    steps.push(`      {id:"aaP", kind:"attack", passif:true, en:"Auto, ${esc(pn.en || "passive")}", fr:"Auto, ${esc(pn.fr || "passif")}"}`);
  for(const s of ["q", "w", "e", "r"]){
    const mine = out.filter(x => x.slot === s);
    if(!mine.length) continue;
    const me = meta.find(x => x.k === s) || {};
    const hasDmg = mine.some(x => x.dmg);
    steps.push(`      {id:"${s}", kind:"${hasDmg ? "spell" : "cast"}"${hasDmg ? "" : `, label:"${s.toUpperCase()}"`}, en:"${s.toUpperCase()} — ${esc(me.en || "")}", fr:"${s.toUpperCase()} — ${esc(me.fr || me.en || "")}"}`);
  }
  p(`    stepMenu:[`);
  p(steps.join(",\n"));
  p(`    ],`);

  /* onStep */
  p(`    onStep(key, st, c){`);
  p(`      const {A, hp, cur} = c, out = {parts:[]};`);
  if(passDmg.length){
    const x = passDmg[0];
    const v = x.pct ? `${x.pct === "hp" ? "hp" : x.pct} * A.${x.a}/100` : `A.${x.a}`;
    p(`      if(st.kind === "attack" && st.passif)`);
    p(`        out.parts.push({n:"${camel((m.pass || {}).name || "passive")}", v:${v}, type:"${x.dmg || "magic"}"});`);
  }
  for(const s of ["q", "w", "e", "r"]){
    const mine = out.filter(x => x.slot === s);
    if(!mine.length) continue;
    const me = meta.find(x => x.k === s) || {};
    const dmg = mine.filter(x => x.dmg && !x.variant && x.kindTag !== "pct");
    const pcts = mine.filter(x => x.kindTag === "pct" && x.stepMul);
    const heal = mine.find(x => x.kindTag === "heal");
    const shield = mine.find(x => x.kindTag === "shield");
    const as = mine.find(x => x.kindTag === "as");
    const body = [];
    if(dmg.length || pcts.length){
      const terms = dmg.map(x => `A.${x.a}`)
        .concat(pcts.map(x => `${x.stepMul} * A.${x.a}/100`));
      const type = (dmg[0] && dmg[0].dmg) || "magic";
      body.push(`out.parts.push({n:"${camel(me.en || s)}", v:${terms.join(" + ")}, type:"${type}"});`);
    }
    if(heal)   body.push(`out.heal = A.${heal.a};`);
    if(shield) body.push(`out.shield = A.${shield.a};`);
    if(as)     body.push(`out.asBonus = A.${as.a};`);
    if(!body.length) continue;
    if(body.length === 1) p(`      if(st.id === "${s}") ${body[0]}`);
    else { p(`      if(st.id === "${s}"){`); body.forEach(x => p(`        ${x}`)); p(`      }`); }
  }
  p(`      return out;`);
  p(`    },`);

  /* abilityRows */
  p(`    abilityRows(c){`);
  p(`      const {A, TR, n0, pc, nf1} = c;`);
  p(`      /* TODO: libelles generiques — a affiner a la relecture */`);
  p(`      return [`);
  const rows = ["q", "w", "e", "r"].map(s => {
    const cells = (rowsFor[s] || []).slice(0, 3).map(r => {
      const f = PCT_ROW.includes(r.kind) ? "pc" : "n0";
      const plus = r.kind === "as" || r.kind === "ms" ? '"+" + ' : "";
      return `{lab:TR("${LAB[r.kind] || "damage"}"), val:${plus}${f}(A.${r.aKey})}`;
    });
    if(ranks.some(([k]) => k === s + "Cd")) cells.push(`{lab:TR("cooldown"), val:nf1.format(A.${s}Cd)+" s"}`);
    return "        [" + cells.join(",\n         ") + "]";
  });
  p(rows.join(",\n"));
  p(`      ];`);
  p(`    },`);
  p(`    combos:[]`);
  p(`  };`);

  /* TODO */
  p(``);
  p(`/* ------------------------------------------------------------------`);
  p(`   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :`);
  if(!todo.length) p(`   (rien a signaler)`);
  else todo.forEach(x => p(`   - ${String(x).replace(/\*\//g, "* /")}`));
  p(`   ------------------------------------------------------------------ */`);

  return L.join("\n") + "\n";
}

/* ------------------------------------------------------------------
   5. Lancement
   ------------------------------------------------------------------ */

function generate(nameOrKey, outDir){
  const list = targets();
  const t = list.find(x => x.file.toLowerCase() === String(nameOrKey).toLowerCase()
                       || x.baseKey.toLowerCase() === String(nameOrKey).toLowerCase()
                       || x.key.toLowerCase() === String(nameOrKey).toLowerCase()
                       || x.name.toLowerCase() === String(nameOrKey).toLowerCase());
  if(!t) throw new Error("champion inconnu : " + nameOrKey);
  const m = build(t);
  const src = render(m);
  if(outDir){
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, t.key + ".js"), src);
  }
  return { key: t.key, src, todo: m.todo };
}

/* Un etat des lieux chiffre : ce que la generation couvre, et ou elle bute. */
function stats(){
  const rows = [];
  for(const t of targets()){
    const m = build(t);
    const dmg = ["q", "w", "e", "r"].filter(s => m.out.some(x => x.slot === s && x.dmg));
    const cd  = ["q", "w", "e", "r"].filter(s => m.ranks.some(([k]) => k === s + "Cd"));
    rows.push({
      key: t.key, dmg: dmg.length, cd: cd.length,
      passive: m.passValues.length > 0,
      forms: m.todo.some(x => /formes dans le wiki/.test(x)),
      six: m.sixRank,
      resource: m.todo.some(x => /ressource particuliere/.test(x)),
      summon: m.todo.some(x => /invoque une unite/.test(x)),
      todo: m.todo.length
    });
  }
  const n = rows.length;
  const count = f => rows.filter(f).length;
  console.log(`champions traites : ${n}`);
  console.log(`  quatre competences qui chiffrent des degats : ${count(r => r.dmg === 4)}`);
  console.log(`  trois                                       : ${count(r => r.dmg === 3)}`);
  console.log(`  deux ou moins                               : ${count(r => r.dmg <= 2)}`);
  console.log(`  quatre recharges lues                       : ${count(r => r.cd === 4)}`);
  console.log(`  passif avec des chiffres dans les donnees   : ${count(r => r.passive)}`);
  console.log(`  competences a plusieurs formes              : ${count(r => r.forms)}`);
  console.log(`  tables a six rangs                          : ${count(r => r.six)}`);
  console.log(`  ressource particuliere                      : ${count(r => r.resource)}`);
  console.log(`  invocation dans le kit                      : ${count(r => r.summon)}`);
  console.log(`  TODO par module : moyenne ${(rows.reduce((a, r) => a + r.todo, 0) / n).toFixed(1)}, maximum ${Math.max(...rows.map(r => r.todo))}`);
  const worst = rows.slice().sort((a, b) => b.todo - a.todo).slice(0, 12);
  console.log("  les plus incomplets : " + worst.map(r => `${r.key} (${r.todo})`).join(", "));
  console.log("  sans aucun degat lu : " + (rows.filter(r => !r.dmg).map(r => r.key).join(", ") || "aucun"));
}

if(require.main === module){
  const args = process.argv.slice(2);
  if(args.includes("--stats")){ stats(); process.exit(0); }
  if(args.includes("--list")){
    targets().forEach(t => console.log(t.key.padEnd(16), t.file));
    process.exit(0);
  }
  let outDir = null;
  const oi = args.indexOf("--out");
  if(oi >= 0){ outDir = path.resolve(args[oi + 1]); args.splice(oi, 2); }
  /* Les seize modules ecrits a la main ne sont jamais regeneres par-dessus :
     ils valent mieux que ce que ce fichier sait produire. */
  const skip = args.includes("--skip-modelled");
  const done = new Set(fs.readdirSync(path.join(ROOT, "champions"))
    .filter(f => f.endsWith(".js")).map(f => f.replace(/\.js$/, "")));
  const only = args.filter(a => !a.startsWith("--"));
  let list = only.length ? only : targets().map(t => t.file);
  let skipped = 0;
  if(skip){
    const keep = [];
    for(const name of list){
      const t = targets().find(x => x.file === name);
      if(t && done.has(t.key)) skipped++; else keep.push(name);
    }
    list = keep;
  }
  let ok = 0, todos = 0, failed = [];
  for(const name of list){
    try {
      const r = generate(name, outDir);
      ok++; todos += r.todo.length;
      if(only.length && !outDir) console.log(r.src);
    } catch(err){ failed.push(name + " : " + err.message); }
  }
  console.log(`modules generes : ${ok}${outDir ? " dans " + outDir : ""} | lignes TODO : ${todos}`
    + (skipped ? ` | deja ecrits a la main, laisses tels quels : ${skipped}` : ""));
  failed.forEach(f => console.log("  echec " + f));
  process.exitCode = failed.length ? 1 : 0;
}

module.exports = { generate, build, render, targets, stats };
