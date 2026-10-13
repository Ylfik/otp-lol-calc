/* Turns the wiki's ability-data wikitext into structured numbers.

   The wiki states every ability the same way: a per-rank progression in
   {{ap|...}}, a per-level one in {{pp|...}}, ratios written as
   "(+ 35% AP)", and the whole lot labelled by {{st|Label|Value|...}}.
   Reading those by hand is where the mistakes came from, so this reads
   them instead, and tools/check-abilities.js proves it against the
   champions that were already modelled by hand.

   Usage: node tools/parse-abilities.js            -> writes data/abilities/
          node tools/parse-abilities.js Pyke       -> prints one champion   */

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "data", "champions");
const OUT = path.join(__dirname, "..", "data", "abilities");

/* ---------- balanced {{ }} scanning ------------------------------------ */

/* Splits a template's inner text on top-level pipes only, so that nested
   templates keep their own pipes. */
function splitPipes(s){
  const out = [];
  let depth = 0, cur = "", i = 0;
  while(i < s.length){
    if(s.startsWith("{{", i) || s.startsWith("[[", i)){ depth++; cur += s.slice(i, i+2); i += 2; continue; }
    if(s.startsWith("}}", i) || s.startsWith("]]", i)){ depth--; cur += s.slice(i, i+2); i += 2; continue; }
    if(s[i] === "|" && depth === 0){ out.push(cur); cur = ""; i++; continue; }
    cur += s[i++];
  }
  out.push(cur);
  return out;
}

/* Every {{name|...}} occurrence, with its inner text, scanned balanced. */
function templates(s, name){
  const out = [];
  const tag = "{{" + name + "|";
  let from = 0, at;
  while((at = s.indexOf(tag, from)) >= 0){
    let i = at + tag.length, depth = 1, inner = "";
    while(i < s.length && depth > 0){
      if(s.startsWith("{{", i)){ depth++; inner += "{{"; i += 2; continue; }
      if(s.startsWith("}}", i)){ depth--; if(!depth){ i += 2; break; } inner += "}}"; i += 2; continue; }
      inner += s[i++];
    }
    out.push({ inner, start: at, end: i });
    from = i;
  }
  return out;
}

/* ---------- arithmetic -------------------------------------------------- */

/* The wiki writes plain arithmetic inside its numbers: "40/8", "1.5*6",
   "8 + (14-8)/17*(x-1)". Only those characters are allowed through. */
function evalExpr(raw, x){
  let e = String(raw).trim();
  if(x !== undefined) e = e.replace(/\bx\b/g, "(" + x + ")");
  if(!/^[0-9+\-*/(). ]+$/.test(e)) return null;
  try {
    const v = Function('"use strict";return (' + e + ")")();
    return Number.isFinite(v) ? v : null;
  } catch(err){ return null; }
}

/* ---------- variables defined at the top of a file ---------------------- */

function varTable(text){
  const vars = {};
  /* A definition's value can itself be a template —
     {{#vardefine:w_tt|{{#expr: {{#var:w_sd}} / {{#var:w_st}}}}}} — so it has
     to be read with a balanced scan. Cutting at the first "}" truncated the
     value, and substituting the broken text later unbalanced the braces,
     which made the scanner swallow the following {{st|...}} row whole. */
  const tag = "{{#vardefine:";
  let from = 0, at;
  while((at = text.indexOf(tag, from)) >= 0){
    let i = at + tag.length, depth = 1, body = "";
    while(i < text.length && depth > 0){
      if(text.startsWith("{{", i)){ depth++; body += "{{"; i += 2; continue; }
      if(text.startsWith("}}", i)){ depth--; if(!depth){ i += 2; break; } body += "}}"; i += 2; continue; }
      body += text[i++];
    }
    const bar = splitPipes(body);
    if(bar.length >= 2) vars[bar[0].trim()] = bar.slice(1).join("|").trim();
    from = i;
  }
  /* a variable may be defined from other variables */
  for(let pass = 0; pass < 4; pass++){
    for(const k of Object.keys(vars)){
      vars[k] = vars[k].replace(/\{\{#var:([^}|]+)\}\}/g, (_, n) => vars[n.trim()] !== undefined ? vars[n.trim()] : _);
      const ex = /\{\{#expr:([^}]*)\}\}/.exec(vars[k]);
      if(ex){ const v = evalExpr(ex[1]); if(v !== null) vars[k] = String(v); }
    }
  }
  return vars;
}

function subVars(s, vars){
  let out = s;
  for(let pass = 0; pass < 3; pass++){
    out = out.replace(/\{\{#var:([^}|]+)\}\}/g, (_, n) => vars[n.trim()] !== undefined ? vars[n.trim()] : _);
  }
  out = out.replace(/\{\{#expr:([^}]*)\}\}/g, (_, e) => { const v = evalExpr(e); return v === null ? _ : String(v); });
  return out;
}

/* ---------- per-rank progression: {{ap|...}} ---------------------------- */

/* Shapes seen across all 175 champions:
     "3 to 8"        five ranks, linear
     "3 to 8 6"      six ranks, linear
     "20|40|60"      spelled out
     "10*8 to 50*8"  arithmetic on each end                                */
/* `ranks` is how many ranks to assume when the wiki does not say. It only
   spells the count out when it is unusual (Udyr's six), so an ultimate
   written "{{ap|200 to 500}}" means three ranks, not five. Getting this
   wrong turned every ultimate into a five-step table. */
function parseAp(inner, ranks){
  const parts = splitPipes(inner).map(s => s.trim()).filter(s => !/^(key|color|label|formula|round)=/.test(s));
  if(!parts.length) return null;

  if(parts.length > 1){
    const vals = parts.map(p => evalExpr(p));
    if(vals.every(v => v !== null)) return vals;
  }

  const one = parts[0];
  const m = /^(.+?)\s+to\s+(.+?)(?:\s+(\d+))?$/.exec(one);
  if(m){
    const a = evalExpr(m[1]), b = evalExpr(m[2]);
    const n = m[3] ? parseInt(m[3], 10) : (ranks || 5);
    if(a === null || b === null || !(n > 1)) return null;
    const out = [];
    for(let i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1));
    return out.map(v => Math.round(v * 1e6) / 1e6);
  }
  const v = evalExpr(one);
  return v === null ? null : [v];
}

/* ---------- per-level progression: {{pp|...}} --------------------------- */

/* "8 + (14-8)/17*(x-1) for 20" is a formula in the champion's level.
   "10 to 50 for 4" means four steps spread over the levels.
   Both are reduced to { at1, at18, perLevel } so a module can use them. */
function parsePp(inner){
  const parts = splitPipes(inner).map(s => s.trim()).filter(s => !/^(key|color|label|formula|round)=/.test(s));
  if(!parts.length) return null;
  const one = parts[0];

  const f = /^(.*?\(x-?1\).*?)(?:\s+for\s+(\d+))?$/.exec(one);
  if(f && /\(x-?1\)/.test(f[1])){
    const at = L => evalExpr(f[1], L);
    const a = at(1), b = at(18);
    if(a === null || b === null) return null;
    return { kind: "level", at1: round6(a), at18: round6(b), formula: f[1].trim() };
  }

  const m = /^(.+?)\s+to\s+(.+?)(?:\s+for\s+(\d+))?$/.exec(one);
  if(m){
    const a = evalExpr(m[1]), b = evalExpr(m[2]);
    if(a === null || b === null) return null;
    return { kind: "level", at1: round6(a), at18: round6(b), steps: m[3] ? +m[3] : null };
  }
  const v = evalExpr(one);
  return v === null ? null : { kind: "flat", at1: v, at18: v };
}

const round6 = v => Math.round(v * 1e6) / 1e6;

/* ---------- ratios: "(+ 35% AP)", "(+ 3.5% per 100 bonus AD)" ---------- */

/* clean() has already removed the wiki's ''' emphasis by the time these
   run, so the quotes are optional throughout. Order matters: the
   "per 100 X" forms must be tested before the bare "AD" / "AP" ones. */
const B = "(?:''')?\\s*";
const STAT_WORDS = [
  [new RegExp("per\\s+100\\s+" + B + "bonus" + B + "\\s*health", "i"), "per100BonusHealth"],
  [new RegExp("per\\s+100\\s+" + B + "bonus" + B + "\\s*(?:AD|attack\\s+damage)", "i"), "per100BonusAD"],
  [/per\s+100\s+AP/i,                          "per100AP"],
  [new RegExp("per\\s+100\\s+" + B + "maximum" + B + "\\s*health", "i"), "per100MaxHealth"],
  [new RegExp(B + "bonus" + B + "\\s*attack\\s+damage", "i"), "bonusAD"],
  [new RegExp(B + "bonus" + B + "\\s*AD", "i"),  "bonusAD"],
  [new RegExp(B + "total" + B + "\\s*AD", "i"),  "totalAD"],
  [new RegExp(B + "maximum" + B + "\\s*health", "i"),  "maxHealth"],
  [new RegExp(B + "missing" + B + "\\s*health", "i"),  "missingHealth"],
  [new RegExp(B + "current" + B + "\\s*health", "i"),  "currentHealth"],
  [new RegExp(B + "bonus" + B + "\\s*health", "i"),    "bonusHealth"],
  [new RegExp(B + "maximum" + B + "\\s*mana", "i"),    "maxMana"],
  [/\bAP\b/,                                   "ap"],
  [/\bAD\b/,                                   "ad"],
  [/\barmor\b/i,                               "armor"],
  [/magic\s+resist/i,                          "mr"]
];

/* Walks the raw text and returns each "(+ ... )" group whole, treating
   {{templates}} as opaque so that a formula's own parentheses — the
   "(x-1)" in a per-level progression — cannot end the group early. */
function ratioGroups(text){
  const out = [];
  let i = 0;
  while(i < text.length){
    /* Every ratio sits inside a {{as|...}} wrapper, so templates are NOT
       skipped here — only once a group has started are they consumed whole,
       which is what keeps a formula's "(x-1)" from closing it early. */
    if(text[i] === "(" && /^\(\s*\+/.test(text.slice(i, i + 4))){
      let d = 1, j = i + 1, body = "";
      while(j < text.length && d > 0){
        if(text.startsWith("{{", j)){
          let dd = 1, k = j + 2;
          while(k < text.length && dd > 0){
            if(text.startsWith("{{", k)){ dd++; k += 2; continue; }
            if(text.startsWith("}}", k)){ dd--; k += 2; continue; }
            k++;
          }
          body += text.slice(j, k); j = k; continue;
        }
        if(text[j] === "("){ d++; body += "("; j++; continue; }
        if(text[j] === ")"){ d--; if(!d){ j++; break; } body += ")"; j++; continue; }
        body += text[j++];
      }
      out.push({ body: body.replace(/^\s*\+\s*/, ""), start: i, end: j });
      i = j; continue;
    }
    i++;
  }
  return out;
}

/* The value with its "(+ ...)" groups removed, so the main progression can
   be found without picking up a ratio's own {{ap}} by mistake. */
function withoutRatios(text){
  const g = ratioGroups(text);
  let out = "", at = 0;
  for(const r of g){ out += text.slice(at, r.start); at = r.end; }
  return out + text.slice(at);
}

function parseRatios(text, ranks){
  const out = [];
  for(const { body: rawBody } of ratioGroups(text)){
    /* a ratio can itself climb with the rank — Udyr's shield is
       "(+ {{ap|2 to 3.5 6}}% maximum health)" — so read the template
       before falling back to a plain number */
    const apT = templates(rawBody, "ap")[0];
    const ppT = templates(rawBody, "pp")[0];
    const body = clean(rawBody);
    /* the figure may be an expression the wiki left unevaluated, such as
       "3.5*2% per 100 bonus AD" — take everything before the % and work it
       out, rather than grabbing the first digits and landing on the 100. */
    let pct = null, perRank = null, perLevel = null;
    if(apT) perRank = parseAp(apT.inner, ranks);
    else if(ppT) perLevel = parsePp(ppT.inner);
    if(!perRank && !perLevel){
      const expr = /^\s*([0-9.+\-*/() ]+?)\s*%/.exec(body);
      if(expr) pct = evalExpr(expr[1]);
      if(pct === null){
        const num = /(-?[0-9.]+)\s*%/.exec(body) || /(-?[0-9.]+)/.exec(body);
        if(!num) continue;
        pct = parseFloat(num[1]);
      }
      if(!Number.isFinite(pct)) continue;
    }
    let stat = null;
    for(const [re2, name] of STAT_WORDS) if(re2.test(body)){ stat = name; break; }
    /* A group naming no stat is kept with stat null rather than dropped —
       Udyr's awakened shield adds a flat "(+ {{ap|45 to 145 6}})" that has
       no stat word, and silently losing it is exactly the kind of bug this
       tool exists to prevent. The checker reports these. */
    const r = { stat, raw: body };
    if(perRank) r.perRank = perRank; else if(perLevel) r.perLevel = perLevel; else r.pct = pct;
    out.push(r);
  }
  return out;
}

/* strips the wiki's display-only wrappers so the words underneath show */
function clean(s){
  let t = s;
  for(let pass = 0; pass < 6; pass++){
    /* ap and pp must be in here too: a ratio is often written
       "(+ {{ap|3.5*2}}% per 100 bonus AD)", and dropping the template
       left the 100 as the first number in the line. */
    t = t.replace(/\{\{(?:as|ccs|sti|tip|ai|ais|ii|iis|ci|cis|si|ri|ui|nie|cai|bi|fd|tt|dv|sbc|st|ap|pp)\|([^{}]*)\}\}/g,
      (_, inner) => splitPipes(inner).filter(x => !/^(icononly|key|color|label|formula|round)=/.test(x))[0] || "");
  }
  t = t.replace(/\{\{[^{}]*\}\}/g, "");
  t = t.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1").replace(/\[\[([^\]]*)\]\]/g, "$1");
  return t.replace(/'''/g, "").replace(/\s+/g, " ").trim();
}

/* ---------- one ability block ------------------------------------------ */

/* A field runs from its own "|name =" line to the next one. The previous
   regex ended it at the first line break, which silently dropped every
   continuation line — and with them whole {{st|...}} rows, such as the
   slow on Udyr's storm. Scanning line by line cannot make that mistake. */
function fieldsOf(block){
  const f = {};
  const lines = block.split("\n");
  let key = null, buf = [];
  const flush = () => { if(key) f[key] = buf.join("\n").trim(); };
  for(const line of lines){
    const m = /^\|([a-z0-9 _]+?)\s*=\s*(.*)$/i.exec(line);
    if(m){ flush(); key = m[1].trim().toLowerCase(); buf = [m[2]]; }
    else if(key) buf.push(line);
  }
  flush();
  return f;
}

function parseLeveling(text, ranks){
  const rows = [];
  for(const t of templates(text, "st")){
    const parts = splitPipes(t.inner);
    for(let i = 0; i + 1 < parts.length; i += 2){
      const label = clean(parts[i]);
      const value = parts[i + 1];
      if(!label) continue;
      /* look for the main progression outside the ratio groups: Udyr's
         awakened shield is "{{pp|20 + ...}} (+ {{ap|45 to 145 6}}) ..." and
         reading the whole string picked the ratio's table as the value */
      const main = withoutRatios(value);
      const ap = templates(main, "ap")[0];
      const pp = templates(main, "pp")[0];
      rows.push({
        label,
        perRank:  ap ? parseAp(ap.inner, ranks) : null,
        perLevel: pp ? parsePp(pp.inner) : null,
        flat:     (!ap && !pp) ? evalExpr(clean(main).replace(/%/g, "")) : null,
        ratios:   parseRatios(value, ranks),
        text:     clean(value)
      });
    }
  }
  return rows;
}

function parseAbility(block, vars){
  const b = subVars(block, vars);
  /* the header is {{{{{1<noinclude>|Ability data</noinclude>}}}|NAME|{{{2|}}}...
     — five opening braces defeat a balanced split, so take NAME directly */
  const nm = /\}\}\}\|([^|]*)\|\{\{\{2/.exec(b.slice(0, 400));
  const name = nm ? nm[1].trim() : null;
  const f = fieldsOf(b);

  /* an ultimate has three ranks, a basic ability five, unless the wiki
     spells out another count (Udyr's stances have six) */
  const ranks = (f.skill || "").trim().toUpperCase() === "R" ? 3 : 5;

  const levels = [];
  for(const k of Object.keys(f)) if(/^leveling\d*$/.test(k)) levels.push(...parseLeveling(f[k], ranks));

  const cdT = templates(f.cooldown || "", "ap")[0] || templates(f.cooldown || "", "pp")[0];
  const costT = templates(f.cost || "", "ap")[0] || templates(f.cost || "", "pp")[0];

  return {
    name,
    slot: f.skill || null,
    damageType: f.damagetype ? clean(f.damagetype) : null,
    targeting: f.targeting ? clean(f.targeting) : null,
    affects: f.affects ? clean(f.affects) : null,
    castTime: f["cast time"] ? clean(f["cast time"]) : null,
    range: f["target range"] ? clean(f["target range"]) : null,
    cooldown: f.cooldown
      ? (templates(f.cooldown, "ap")[0] ? parseAp(templates(f.cooldown, "ap")[0].inner, ranks)
        : templates(f.cooldown, "pp")[0] ? parsePp(templates(f.cooldown, "pp")[0].inner)
        : evalExpr(clean(f.cooldown)))
      : null,
    cost: f.cost
      ? (templates(f.cost, "ap")[0] ? parseAp(templates(f.cost, "ap")[0].inner, ranks)
        : templates(f.cost, "pp")[0] ? parsePp(templates(f.cost, "pp")[0].inner)
        : evalExpr(clean(f.cost)))
      : null,
    costType: f.costtype ? clean(f.costtype) : null,
    leveling: levels
  };
}

/* ---------- a whole champion ------------------------------------------- */

function parseChampion(file){
  const text = fs.readFileSync(path.join(SRC, file), "utf8");
  const vars = varTable(text);
  const marks = [];
  const tag = "{{{{{1<noinclude>";
  let from = 0, at;
  while((at = text.indexOf(tag, from)) >= 0){ marks.push(at); from = at + 1; }
  const abilities = marks.map((start, i) => {
    const end = i + 1 < marks.length ? marks[i + 1] : text.length;
    return parseAbility(text.slice(start, end), vars);
  });
  return { champion: file, abilities };
}

/* ---------- run --------------------------------------------------------- */

if(require.main === module){
  const only = process.argv[2];
  if(only){
    console.log(JSON.stringify(parseChampion(only), null, 1));
  } else {
    fs.mkdirSync(OUT, { recursive: true });
    let n = 0, rows = 0, unparsed = 0;
    for(const f of fs.readdirSync(SRC)){
      const c = parseChampion(f);
      c.abilities.forEach(a => a.leveling.forEach(r => {
        rows++;
        if(!r.perRank && !r.perLevel && r.flat === null && !r.ratios.length) unparsed++;
      }));
      fs.writeFileSync(path.join(OUT, f + ".json"), JSON.stringify(c, null, 1));
      n++;
    }
    console.log("champions:", n, "| lignes de leveling:", rows, "| non interpretees:", unparsed);
  }
}

module.exports = { parseChampion, parseLeveling, templates, splitPipes, subVars, varTable, parseAp, parsePp, parseRatios, clean, evalExpr };
