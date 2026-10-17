/* xinzhao — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Xin Zhao.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"xinzhao", name:"XinZhao", label:"Xin Zhao", splash:0,
    base:{hp:[620,106], mana:[274,55], ad:[63,3],
          ar:[35,4.4], mr:[32,2.05],
          as:0.645, asPerLevel:3.5, ms:345},
    abilities_meta:[
      {k:"q", en:"Three Talon Strike", fr:"Frappe des trois serres"},
      {k:"w", en:"Wind Becomes Lightning", fr:"Vent et foudre"},
      {k:"e", en:"Audacious Charge", fr:"Charge audacieuse"},
      {k:"r", en:"Crescent Guard", fr:"Garde circulaire"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[15,30,45,60,75], qBonusAD:0.4, qTotal:[45,90,135,180,225], qTotalBonusAD:1.2, qCd:[7,6.5,6,5.5,5],
      wFlat:[30,40,50,60,70], wAD:0.3, wThrust:[50,85,120,155,190], wThrustAD:0.9, wThrustAP:0.65, wTotal:[80,125,170,215,260], wTotalAD:1.2, wTotalAP:0.65, wCd:[12,11,10,9,8],
      eFlat:[50,75,100,125,150], eAP:1.2, eAS:[38,46,54,62,70], eASAP100:10, eCd:[11,11,11,11,11],
      rFlat:[75,175,275], rBonusAD:1, rAP:1.1, rCurPct:15, rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Three Talon Strike */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD;
      /* W — Wind Becomes Lightning */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad;
      A.wThrust = R(T.wThrust,wr) + T.wThrustAD*tot.ad + T.wThrustAP*ap;
      A.wTotal = R(T.wTotal,wr) + T.wTotalAD*tot.ad + T.wTotalAP*ap;
      /* E — Audacious Charge */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eAS = R(T.eAS,er) + T.eASAP100*ap/100;
      /* R — Crescent Guard */
      A.rCurPct = T.rCurPct;   /* % des PV de la cible, applique dans onStep */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; A.wThrust=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; A.eAS=0; }
      if(!learned.r){ A.rCurPct=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Determination","Détermination"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Three Talon Strike", fr:"Q — Frappe des trois serres"},
      {id:"w", kind:"spell", en:"W — Wind Becomes Lightning", fr:"W — Vent et foudre"},
      {id:"e", kind:"spell", en:"E — Audacious Charge", fr:"E — Charge audacieuse"},
      {id:"r", kind:"spell", en:"R — Crescent Guard", fr:"R — Garde circulaire"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"threeTalonStrike", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"windBecomesLightning", v:A.wDmg, type:"phys"});
      if(st.id === "e"){
        out.parts.push({n:"audaciousCharge", v:A.eDmg, type:"magic"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r") out.parts.push({n:"crescentGuard", v:A.rDmg + cur * A.rCurPct/100, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wThrust)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rCurPct)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Physical Damage per Slash : ligne non modelisee (30/4 to 70/4 (+ 30/4% AD))
   - E / Bonus Attack Speed : ratio sans statistique « 1% per 5% bonus attack speed from non-buff sources » non modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
