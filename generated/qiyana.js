/* qiyana — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Qiyana.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"qiyana", name:"Qiyana", label:"Qiyana", splash:0,
    base:{hp:[590,115], mana:[375,60], ad:[64,3.1],
          ar:[31,4.5], mr:[32,2.05],
          as:0.688, asPerLevel:2.1, ms:335},
    abilities_meta:[
      {k:"q", en:"Elemental Wrath / Edge of Ixtal", fr:"Courroux élémentaire/Lame d'Ixtal"},
      {k:"w", en:"Terrashape", fr:"Terraforce"},
      {k:"e", en:"Audacity", fr:"Audace"},
      {k:"r", en:"Supreme Display of Talent", fr:"Tour de force suprême"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,110,140,170,200], qBonusAD:0.9, qCd:[7,7,7,7,7],
      wAS:[15,20,25,30,35], wFlat:[8,16,24,32,40], wBonusAD:0.2, wAP:0.45, wMs:[3,5,7,9,11], wCd:[7,7,7,7,7],
      eFlat:[50,90,130,170,210], eBonusAD:0.5, eCd:[11,10,9,8,7],
      rFlat:[100,200,300], rBonusAD:1.25, rHpPct:10, rCd:[120,120,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Elemental Wrath / Edge of Ixtal */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Terrashape */
      A.wAS = R(T.wAS,wr);
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      A.wMs = R(T.wMs,wr);
      /* E — Audacity */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Supreme Display of Talent */
      A.rHpPct = T.rHpPct;   /* % des PV de la cible, applique dans onStep */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wAS=0; A.wDmg=0; A.wMs=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rHpPct=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Royal Privilege","Privilège royal"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Elemental Wrath / Edge of Ixtal", fr:"Q — Courroux élémentaire/Lame d'Ixtal"},
      {id:"w", kind:"spell", en:"W — Terrashape", fr:"W — Terraforce"},
      {id:"e", kind:"spell", en:"E — Audacity", fr:"E — Audace"},
      {id:"r", kind:"spell", en:"R — Supreme Display of Talent", fr:"R — Tour de force suprême"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"elementalWrathEdgeOfIxtal", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"terrashape", v:A.wDmg, type:"magic"});
        out.asBonus = A.wAS;
      }
      if(st.id === "e") out.parts.push({n:"audacity", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"supremeDisplayOfTalent", v:A.rDmg + hp * A.rHpPct/100, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rHpPct)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Edge of Ixtal, Elemental Wrath) — seule la premiere est modelisee
   - Q / Reduced Damage : ligne non modelisee (80*0.75 to 200*0.75 (+ 90*0.75% bonus AD))
   - R / Capped Monster Health Damage : ligne non modelisee (500 to 1000 3 (+ 125% bonus AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
