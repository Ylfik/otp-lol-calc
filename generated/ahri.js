/* ahri — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ahri.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ahri", name:"Ahri", label:"Ahri", splash:0,
    base:{hp:[590,104], mana:[418,25], ad:[53,3],
          ar:[21,4.2], mr:[30,1.3],
          as:0.668, asPerLevel:2.2, ms:330},
    abilities_meta:[
      {k:"q", en:"Orb of Deception", fr:"Orbe d'illusion"},
      {k:"w", en:"Fox-Fire", fr:"Lucioles"},
      {k:"e", en:"Charm", fr:"Charme"},
      {k:"r", en:"Spirit Rush", fr:"Assaut spirituel"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,120,170,220,270], qAP:1, qCd:[7,7,7,7,7],
      wFlat:[40,60,80,100,120], wAP:0.4, wSubsequent:[16,24,32,40,48], wSubsequentAP:0.16, wTotal:[72,108,144,180,216], wTotalAP:0.72, wCd:[9,8,7,6,5],
      eFlat:[80,120,160,200,240], eAP:0.85, eCc:[1.2,1.35,1.5,1.65,1.8], eCd:[12,12,12,12,12],
      rFlat:[75,125,175], rAP:0.35, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Orb of Deception */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Fox-Fire */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wSubsequent = R(T.wSubsequent,wr) + T.wSubsequentAP*ap;
      A.wTotal = R(T.wTotal,wr) + T.wTotalAP*ap;
      /* E — Charm */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eCc = R(T.eCc,er);
      /* R — Spirit Rush */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wSubsequent=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; A.eCc=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Essence Theft","Vol essentiel"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Orb of Deception", fr:"Q — Orbe d'illusion"},
      {id:"w", kind:"spell", en:"W — Fox-Fire", fr:"W — Lucioles"},
      {id:"e", kind:"spell", en:"E — Charm", fr:"E — Charme"},
      {id:"r", kind:"spell", en:"R — Spirit Rush", fr:"R — Assaut spirituel"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"orbOfDeception", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"foxFire", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"charm", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"spiritRush", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wSubsequent)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Total Mixed Damage » prise comme ligne principale
   - Q / Damage Per Pass : ligne non modelisee (35 to 135 (+ 50% AP))
   - W / Primary Minion Damage : ligne non modelisee (40*2 to 120*2 (+ 40*2% AP))
   - W / Subsequent Minion Damage : ligne non modelisee (40*2*0.4 to 120*2*0.4 (+ 40*2*0.4% AP))
   - passif : 2 blocs dans le wiki (Essence Theft, Vastayan Grace) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
