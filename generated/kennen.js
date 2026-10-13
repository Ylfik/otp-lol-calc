/* kennen — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kennen.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kennen", name:"Kennen", label:"Kennen", splash:0,
    base:{hp:[580,98], mana:[200,0], ad:[48,3.75],
          ar:[29,4.95], mr:[30,1.3],
          as:0.625, asPerLevel:3.4, ms:335},
    abilities_meta:[
      {k:"q", en:"Thundering Shuriken", fr:"Shuriken foudroyant"},
      {k:"w", en:"Electrical Surge", fr:"Surtension"},
      {k:"e", en:"Lightning Rush", fr:"Rush foudroyant"},
      {k:"r", en:"Slicing Maelstrom", fr:"Maelström"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[75,125,175,225,275], qAP:0.75, qCd:[7,6.25,5.5,4.75,4],
      wFlat:[35,45,55,65,75], wBonusAD:[0.8,0.9,1,1.1,1.2], wAP:0.35, wCd:[13,11.25,9.5,7.75,6],
      eFlat:[80,120,160,200,240], eAP:0.8, eAS:[50,60,70,80,90], eCd:[10,9,8,7,6],
      rFlat:[300,600,900], rAP:1.875, rCd:[120,120,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Thundering Shuriken */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Electrical Surge */
      A.wDmg = R(T.wFlat,wr) + R(T.wBonusAD,wr)*bonusAD + T.wAP*ap;
      /* E — Lightning Rush */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eAS = R(T.eAS,er);
      /* R — Slicing Maelstrom */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eAS=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Mark of the Storm","Marque de tempête"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Thundering Shuriken", fr:"Q — Shuriken foudroyant"},
      {id:"w", kind:"spell", en:"W — Electrical Surge", fr:"W — Surtension"},
      {id:"e", kind:"spell", en:"E — Lightning Rush", fr:"E — Rush foudroyant"},
      {id:"r", kind:"spell", en:"R — Slicing Maelstrom", fr:"R — Maelström"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"thunderingShuriken", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"electricalSurge", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"lightningRush", v:A.eDmg, type:"magic"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r") out.parts.push({n:"slicingMaelstrom", v:A.rDmg, type:"magic"});
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
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Magic Damage : doublon de Bonus Magic Damage, ignore
   - E / Non-Champion Damage : ligne non modelisee (80*0.65 to 240*0.65 (+ 80*0.65% AP))
   - R : pas de ligne de degats simple, « Total Single-Target Damage » prise comme ligne principale
   - R / Bonus Resistances : ligne non modelisee (25 to 75)
   - R / Magic Damage Per Bolt : ligne non modelisee (40 to 120 (+ 25% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Energy) : non modelisee
   ------------------------------------------------------------------ */
