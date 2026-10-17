/* irelia — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Irelia.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"irelia", name:"Irelia", label:"Irelia", splash:0,
    base:{hp:[630,115], mana:[350,50], ad:[65,3.5],
          ar:[36,4.7], mr:[30,2.05],
          as:0.656, asPerLevel:2.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Bladesurge", fr:"Rush fatal"},
      {k:"w", en:"Defiant Dance", fr:"Danse de défi"},
      {k:"e", en:"Flawless Duet", fr:"Duo parfait"},
      {k:"r", en:"Vanguard's Edge", fr:"Pointe de l'avant-garde"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[5,25,45,65,85], qAD:0.7, qHeal:[9,10,11,12,13], qCd:[10,9,8,7,6],
      wFlat:[10,20,30,40,50], wAD:0.4, wAP:0.5, wMax:[30,60,90,120,150], wMaxAD:1.2, wMaxAP:1.5, wCd:[20,18,16,14,12],
      eFlat:[70,110,150,190,230], eAP:1, eCd:[16,14.5,13,11.5,10],
      rFlat:[125,200,275], rAP:0.7, rCd:[125,105,85]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bladesurge */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      A.qHeal = (R(T.qHeal,qr))/100*tot.ad;
      /* W — Defiant Dance */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAD*tot.ad + T.wMaxAP*ap;
      /* E — Flawless Duet */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Vanguard's Edge */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHeal=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Ionian Fervor","Ferveur ionienne"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bladesurge", fr:"Q — Rush fatal"},
      {id:"w", kind:"spell", en:"W — Defiant Dance", fr:"W — Danse de défi"},
      {id:"e", kind:"spell", en:"E — Flawless Duet", fr:"E — Duo parfait"},
      {id:"r", kind:"spell", en:"R — Vanguard's Edge", fr:"R — Pointe de l'avant-garde"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"bladesurge", v:A.qDmg, type:"phys"});
        out.heal = A.qHeal;
      }
      if(st.id === "w") out.parts.push({n:"defiantDance", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"flawlessDuet", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"vanguardSEdge", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : pas de ligne de degats simple, « Minimum Physical Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
