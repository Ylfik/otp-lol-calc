/* caitlyn — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Caitlyn.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"caitlyn", name:"Caitlyn", label:"Caitlyn", splash:0,
    base:{hp:[580,107], mana:[315,40], ad:[62,3.8],
          ar:[27,4.7], mr:[33,1.1],
          as:0.681, asPerLevel:4, ms:325},
    abilities_meta:[
      {k:"q", en:"Piltover Peacemaker", fr:"Pacificateur de Piltover"},
      {k:"w", en:"Yordle Snap Trap", fr:"Piège-yordle"},
      {k:"e", en:"90 Caliber Net", fr:"Filet de calibre 90"},
      {k:"r", en:"Ace in the Hole", fr:"Tir chirurgical"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[50,90,130,170,210], qAD:[1.25,1.45,1.65,1.85,2.05], qCd:[10,9,8,7,6],
      wIncPct:[35,80,125,170,215], wIncPctBonusAD:0.3, wCd:[0.5,0.5,0.5,0.5,0.5],
      eFlat:[80,130,180,230,280], eAP:0.8, eCd:[16,14,12,10,8],
      rFlat:[300,475,650], rBonusAD:1, rCd:[90,90,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Piltover Peacemaker */
      A.qDmg = R(T.qFlat,qr) + R(T.qAD,qr)*tot.ad;
      /* E — 90 Caliber Net */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Ace in the Hole */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Headshot","Tir dans la tête"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Piltover Peacemaker", fr:"Q — Pacificateur de Piltover"},
      {id:"e", kind:"spell", en:"E — 90 Caliber Net", fr:"E — Filet de calibre 90"},
      {id:"r", kind:"spell", en:"R — Ace in the Hole", fr:"R — Tir chirurgical"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"piltoverPeacemaker", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"90CaliberNet", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"aceInTheHole", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
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
   - Q / Reduced Damage : ligne non modelisee (50*0.6 to 210*0.6 (+ 125*0.6 to 205*0.6% AD))
   - W / Trap Duration : ligne non modelisee (30 to 50 seconds)
   - W / Maximum Number of Traps : ligne non modelisee (3)
   - W / Headshot Damage Increase : augmentation sans ligne de degats a augmenter
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
