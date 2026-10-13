/* varus — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Varus.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"varus", name:"Varus", label:"Varus", splash:0,
    base:{hp:[600,105], mana:[320,40], ad:[59,3.4],
          ar:[24,4], mr:[33,1.1],
          as:0.658, asPerLevel:3.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Piercing Arrow", fr:"Flèche perforante"},
      {k:"w", en:"Blighted Quiver", fr:"Carquois meurtri"},
      {k:"e", en:"Hail of Arrows", fr:"Pluie de flèches"},
      {k:"r", en:"Chain of Corruption", fr:"Chaîne corruptrice"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[53.333333,100,146.666667,193.333333,240], qBonusAD:0.8, qMax:[80,150,220,290,360], qMaxBonusAD:1.2, qCd:[16,15,14,13,12],
      wFlat:[4,13,22,31,40], wBonusAD:0.15, wAP:0.25, wPerStackHpPct:[3,3.5,4,4.5,5], wPerStackAP100:1.3, wHpPct:[9,10.5,12,13.5,15], wAP100:3.9, wPxHpPct:[4.5,5.25,6,6.75,7.5], wPxAP100:1.95, wMissPct:[6,8,10,12,14], wActiveMissPct:[9,12,15,18,21], wCd:[40,40,40,40,40],
      eFlat:[60,90,120,150,180], eBonusAD:0.9, eSlow:[30,35,40,45,50], eCd:[18,16,14,12,10],
      rFlat:[150,250,350], rAP:1, rCd:[100,80,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Piercing Arrow */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qMax = R(T.qMax,qr) + T.qMaxBonusAD*bonusAD;
      /* W — Blighted Quiver */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      A.wPerStackHpPct = R(T.wPerStackHpPct,wr) + T.wPerStackAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.wHpPct = R(T.wHpPct,wr) + T.wAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.wPxHpPct = R(T.wPxHpPct,wr) + T.wPxAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.wMissPct = R(T.wMissPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wActiveMissPct = R(T.wActiveMissPct,wr);   /* % des PV de la cible, applique dans onStep */
      /* E — Hail of Arrows */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eSlow = R(T.eSlow,er);
      /* R — Chain of Corruption */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wDmg=0; A.wPerStackHpPct=0; A.wHpPct=0; A.wPxHpPct=0; A.wMissPct=0; A.wActiveMissPct=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Living Vengeance","Vengeance incarnée"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Piercing Arrow", fr:"Q — Flèche perforante"},
      {id:"w", kind:"spell", en:"W — Blighted Quiver", fr:"W — Carquois meurtri"},
      {id:"e", kind:"spell", en:"E — Hail of Arrows", fr:"E — Pluie de flèches"},
      {id:"r", kind:"spell", en:"R — Chain of Corruption", fr:"R — Chaîne corruptrice"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"piercingArrow", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"blightedQuiver", v:A.wDmg + hp * A.wPerStackHpPct/100 + hp * A.wHpPct/100 + hp * A.wPxHpPct/100 + Math.max(0, hp - cur) * A.wMissPct/100 + Math.max(0, hp - cur) * A.wActiveMissPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"hailOfArrows", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"chainOfCorruption", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("mPpct"), val:pc(A.wPerStackHpPct)},
         {lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Minimum Physical Damage » prise comme ligne principale
   - Q / Minimum Reduced Damage : ligne non modelisee (80/1.5*0.33 to 360/1.5*0.33 (+ (120/1.5)*0.33% bonus AD))
   - Q / Maximum Reduced Damage : ligne non modelisee (80*0.33 to 360*0.33 (+ 120*0.33% bonus AD))
   - W / 20px|border|link= Maximum Bonus Magic Damage at Max Stacks : doublon de Bonus Magic Damage at Max Stacks, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
