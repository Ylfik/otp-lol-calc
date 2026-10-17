/* brand — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Brand.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"brand", name:"Brand", label:"Brand", splash:0,
    base:{hp:[570,105], mana:[469,21], ad:[57,3],
          ar:[24,4.2], mr:[30,1.3],
          as:0.681, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Sear", fr:"Brûlure"},
      {k:"w", en:"Pillar of Flame", fr:"Colonne de flammes"},
      {k:"e", en:"Conflagration", fr:"Conflagration"},
      {k:"r", en:"Pyroclasm", fr:"Pyrolyse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,100,130,160,190], qAP:0.65, qCd:[8,7.5,7,6.5,6],
      wFlat:[75,120,165,210,255], wAP:0.7, wMax:[93.75,150,206.25,262.5,318.75], wMaxAP:0.875, wCd:[10,9.5,9,8.5,8],
      eFlat:[55,80,105,130,155], eAP:0.6, eCd:[13,12,11,10,9],
      rFlat:[100,175,250], rAP:0.3, rTotal:[300,525,750], rTotalAP:0.9, rSlow:[30,45,60], rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Sear */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Pillar of Flame */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      /* E — Conflagration */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Pyroclasm */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rTotal=0; A.rSlow=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Blaze","Flammes"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Sear", fr:"Q — Brûlure"},
      {id:"w", kind:"spell", en:"W — Pillar of Flame", fr:"W — Colonne de flammes"},
      {id:"e", kind:"spell", en:"E — Conflagration", fr:"E — Conflagration"},
      {id:"r", kind:"spell", en:"R — Pyroclasm", fr:"R — Pyrolyse"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"sear", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"pillarOfFlame", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"conflagration", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"pyroclasm", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
