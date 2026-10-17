/* Charger un module champion hors navigateur, et lui donner le meme
   contexte qu'index.html.

   Extrait de check-generated.js pour que les autres controles — celui des
   passifs, notamment — jugent les modules dans exactement les memes
   conditions. Deux harnais qui simulent le moteur chacun de leur cote
   finissent par simuler deux moteurs differents. */

const fs = require("fs");
const vm = require("vm");

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


module.exports = { loadSrc, loadFile, context, lerp, R1, msSoftCap };
