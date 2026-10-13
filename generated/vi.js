/* vi — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Vi.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"vi", name:"Vi", label:"Vi", splash:0,
    base:{hp:[655,105], mana:[295,65], ad:[61,3.5],
          ar:[30,4.7], mr:[32,2.05],
          as:0.644, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Vault Breaker", fr:"Brise-coffre"},
      {k:"w", en:"Denting Blows", fr:"Coups fracassants"},
      {k:"e", en:"Relentless Force", fr:"Force implacable"},
      {k:"r", en:"Cease and Desist", fr:"Mise en demeure"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[40,60,80,100,120], qBonusAD:0.6, qMax:[100,150,200,250,300], qMaxBonusAD:1.5, qCd:[12,10.5,9,7.5,6],
      wHpPct:[4,5,6,7,8], wBonusAD100:3.5, wAS:[30,35,40,45,50],
      eFlat:[10,30,50,70,90], eAD:1.1, eAP:1,
      rFlat:[150,250,350], rBonusAD:0.9, rCd:[140,115,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Vault Breaker */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qMax = R(T.qMax,qr) + T.qMaxBonusAD*bonusAD;
      /* W — Denting Blows */
      A.wHpPct = R(T.wHpPct,wr) + T.wBonusAD100*bonusAD/100;   /* % des PV de la cible, applique dans onStep */
      A.wAS = R(T.wAS,wr);
      /* E — Relentless Force */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad + T.eAP*ap;
      /* R — Cease and Desist */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wHpPct=0; A.wAS=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Blast Shield","Bouclier antichoc"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Vault Breaker", fr:"Q — Brise-coffre"},
      {id:"w", kind:"spell", en:"W — Denting Blows", fr:"W — Coups fracassants"},
      {id:"e", kind:"spell", en:"E — Relentless Force", fr:"E — Force implacable"},
      {id:"r", kind:"spell", en:"R — Cease and Desist", fr:"R — Mise en demeure"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"vaultBreaker", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"dentingBlows", v:hp * A.wHpPct/100, type:"magic"});
        out.asBonus = A.wAS;
      }
      if(st.id === "e") out.parts.push({n:"relentlessForce", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"ceaseAndDesist", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("bonusAs"), val:"+" + pc(A.wAS)}],
        [{lab:TR("damage"), val:n0(A.eDmg)}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Minimum Physical Damage » prise comme ligne principale
   - W : aucune recharge dans les donnees wiki
   - E : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
