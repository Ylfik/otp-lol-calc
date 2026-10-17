/* azir — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Azir.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"azir", name:"Azir", label:"Azir", splash:0,
    base:{hp:[575,108], mana:[320,40], ad:[56,3.5],
          ar:[25,5], mr:[30,1.3],
          as:0.625, asPerLevel:5, ms:330},
    abilities_meta:[
      {k:"q", en:"Conquering Sands", fr:"Sables conquérants"},
      {k:"w", en:"Arise!", fr:"Dresse-toi !"},
      {k:"e", en:"Shifting Sands", fr:"Sables mouvants"},
      {k:"r", en:"Emperor's Divide", fr:"Partition impériale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[75,95,115,135,155], qAP:[0.35,0.4,0.45,0.5,0.55], qCd:[14,12,10,8,6],
      wAdd:[50,65,80,95,110], wAP:[0.35,0.425,0.5,0.575,0.65], wCd:[1.5,1.5,1.5,1.5,1.5],
      eShield:[70,110,150,190,230], eShieldAP:0.6, eFlat:[70,110,150,190,230], eAP:0.6, eCd:[22,20.5,19,17.5,16],
      rFlat:[200,400,600], rAP:0.75, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Conquering Sands */
      A.qDmg = R(T.qFlat,qr) + R(T.qAP,qr)*ap;
      /* W — Arise! */
      A.wDmg = R(T.wAdd,wr) + R(T.wAP,wr)*ap;
      /* E — Shifting Sands */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Emperor's Divide */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eShield=0; A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Shurima's Legacy","Héritage de Shurima"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Conquering Sands", fr:"Q — Sables conquérants"},
      {id:"w", kind:"spell", en:"W — Arise!", fr:"W — Dresse-toi !"},
      {id:"e", kind:"spell", en:"E — Shifting Sands", fr:"E — Sables mouvants"},
      {id:"r", kind:"spell", en:"R — Emperor's Divide", fr:"R — Partition impériale"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"conqueringSands", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"arise", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"shiftingSands", v:A.eDmg, type:"magic"});
        out.shield = A.eShield;
      }
      if(st.id === "r") out.parts.push({n:"emperorSDivide", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Width : ligne non modelisee (6 to 8 soldiers)
   - R / Width (charge) : ligne non modelisee (er 620 to 820)
   - R / Width (impassable wall) : ligne non modelisee (pathing radius 750 to 950)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
