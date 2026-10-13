/* sivir — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Sivir.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"sivir", name:"Sivir", label:"Sivir", splash:0,
    base:{hp:[600,104], mana:[340,45], ad:[60,2.5],
          ar:[30,4], mr:[33,1.1],
          as:0.625, asPerLevel:1.6, ms:335},
    abilities_meta:[
      {k:"q", en:"Boomerang Blade", fr:"Lame boomerang"},
      {k:"w", en:"Ricochet", fr:"Ricochet"},
      {k:"e", en:"Spell Shield", fr:"Bouclier magique"},
      {k:"r", en:"On The Hunt", fr:"En chasse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,85,110,135,160], qBonusAD:0.7, qAP:0.6, qMin:[24,34,44,54,64], qMinBonusAD:0.28, qMinAP:0.24, qTotal:[120,170,220,270,320], qTotalBonusAD:1.4, qTotalAP:1.2, qCd:[10,9.5,9,8.5,8],
      wAS:[20,25,30,35,40], wFlat:[40,42.5,45,47.5,50], wCd:[12,12,12,12,12],
      eHeal:[60,65,70,75,80], eHealAP:0.5, eCd:[24,22.5,21,19.5,18],
      rMs:[20,25,30], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Boomerang Blade */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      A.qMin = R(T.qMin,qr) + T.qMinBonusAD*bonusAD + T.qMinAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD + T.qTotalAP*ap;
      /* W — Ricochet */
      A.wAS = R(T.wAS,wr);
      A.wDmg = (R(T.wFlat,wr))/100*tot.ad;
      A.wBounce = (0 /* TODO: valeur absente des donnees */)/100*tot.ad;
      /* E — Spell Shield */
      A.eHeal = (R(T.eHeal,er))/100*tot.ad + T.eHealAP*ap;
      /* R — On The Hunt */
      A.rMs = R(T.rMs,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMin=0; A.qTotal=0; }
      if(!learned.w){ A.wAS=0; A.wDmg=0; A.wBounce=0; }
      if(!learned.e){ A.eHeal=0; }
      if(!learned.r){ A.rMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Fleet of Foot","Mille-pattes"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Boomerang Blade", fr:"Q — Lame boomerang"},
      {id:"w", kind:"spell", en:"W — Ricochet", fr:"W — Ricochet"},
      {id:"e", kind:"cast", label:"E", en:"E — Spell Shield", fr:"E — Bouclier magique"},
      {id:"r", kind:"cast", label:"R", en:"R — On The Hunt", fr:"R — En chasse"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"boomerangBlade", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"ricochet", v:A.wDmg, type:"phys"});
        out.asBonus = A.wAS;
      }
      if(st.id === "e") out.heal = A.eHeal;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wBounce)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.eHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Bounce Critical Damage : aucune valeur lisible ({{as|{{ap|40* /100 to 50* /100}}% AD}})
   - W / Minion Bounce Damage : ligne non modelisee (40*0.65 to 50*0.65% AD)
   - W / Minion Bounce Critical Damage : ligne non modelisee ({{as|{{ap|(40*0.65)* /100 to (50*0.65)* /100}}% AD}})
   - R / Buff Duration : ligne non modelisee (8 to 12 seconds)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
