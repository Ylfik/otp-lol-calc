/* xinzhao — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    key:"xinzhao", name:"XinZhao", label:"Xin Zhao", splash:0,
    base:{hp:[620,106], mana:[274,55], ad:[63,3], ar:[35,4.4], mr:[32,2.05],
          as:0.645, asPerLevel:3.5, ms:345},
    abilities_meta:[
      {k:"q", en:"Three Talon Strike", fr:"Triple frappe"},
      {k:"w", en:"Wind Becomes Lightning", fr:"Le vent devient foudre"},
      {k:"e", en:"Audacious Charge", fr:"Charge audacieuse"},
      {k:"r", en:"Crescent Guard", fr:"Garde du croissant"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[15,30,45,60,75], qBonusAD:0.40,
      wSlash:[30,40,50,60,70], wSlashAD:0.30,
      wThrust:[50,85,120,155,190], wThrustAD:0.90, wThrustAP:0.65,
      eFlat:[50,75,100,125,150], eAP:1.20, eAS:[38,46,54,62,70], eASAP:10,
      rFlat:[75,175,275], rBonusAD:1.00, rAP:1.10, rCurPct:15,
      qCd:[7,6.5,6,5.5,5], wCd:[12,11,10,9,8], eCd:[11,11,11,11,11], rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, bonusAD, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* the Q empowers three attacks, so one hit and the set are both useful */
      A.qHit    = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qAll    = A.qHit * 3;
      A.wSlash  = R(T.wSlash,wr)  + T.wSlashAD*tot.ad;
      A.wThrust = R(T.wThrust,wr) + T.wThrustAD*tot.ad + T.wThrustAP*ap;
      A.wBoth   = A.wSlash + A.wThrust;
      A.eDmg    = R(T.eFlat,er) + T.eAP*ap;
      A.eAS     = R(T.eAS,er) + T.eASAP*ap/100;
      A.rFlat   = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.rCurPct = T.rCurPct;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHit = 0; A.qAll = 0; }
      if(!learned.w){ A.wSlash = 0; A.wThrust = 0; A.wBoth = 0; }
      if(!learned.e){ A.eDmg = 0; A.eAS = 0; }
      if(!learned.r){ A.rFlat = 0; A.rCurPct = 0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Determination","Détermination"],
    passiveRows(c){ const {TR} = c; return [{lab:TR("wipStat"), val:"—"}]; },
    stepMenu:[
      {id:"aa",  kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"aaQ", kind:"attack", talon:true, en:"Auto, Three Talon Strike", fr:"Auto, Triple frappe"},
      {id:"q", kind:"cast", label:"Q", en:"Q — empower three attacks", fr:"Q — renforcer trois attaques"},
      {id:"w", kind:"spell", en:"W — slash and thrust", fr:"W — fauche et estoc"},
      {id:"e", kind:"spell", en:"E — Audacious Charge", fr:"E — Charge audacieuse"},
      {id:"r", kind:"spell", en:"R — Crescent Guard", fr:"R — Garde du croissant"}
    ],
    onStep(key, st, c){
      const {A, cur} = c, out = {parts:[]};
      if(st.kind === "attack" && st.talon)
        out.parts.push({n:"threeTalon", v:A.qHit, type:"phys"});
      if(st.id === "w") out.parts.push({n:"windLightning", v:A.wBoth, type:"phys"});
      if(st.id === "e"){
        out.parts.push({n:"audaciousCharge", v:A.eDmg, type:"magic"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r")
        out.parts.push({n:"crescentGuard", v:A.rFlat + cur*A.rCurPct/100, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("xQhit"), val:n0(A.qHit)}, {lab:TR("xQall"), val:n0(A.qAll), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("xWslash"), val:n0(A.wSlash)}, {lab:TR("xWthrust"), val:n0(A.wThrust)},
         {lab:TR("xWboth"), val:n0(A.wBoth), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("bonusAs"), val:"+" + pc(A.eAS), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rFlat)}, {lab:TR("xRcur"), val:pc(A.rCurPct), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
