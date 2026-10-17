/* kogmaw — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kog'Maw.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kogmaw", name:"KogMaw", label:"Kog'Maw", splash:0,
    base:{hp:[635,99], mana:[325,40], ad:[61,3.1],
          ar:[24,4.45], mr:[33,1.1],
          as:0.665, asPerLevel:2.65, ms:330},
    abilities_meta:[
      {k:"q", en:"Caustic Spittle", fr:"Bave caustique"},
      {k:"w", en:"Bio-Arcane Barrage", fr:"Barrage bio-arcanique"},
      {k:"e", en:"Void Ooze", fr:"Limon du Néant"},
      {k:"r", en:"Living Artillery", fr:"Artillerie vivante"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qAS:[5,10,15,20,25], qFlat:[80,125,170,215,260], qAP:0.9, qCd:[7,7,7,7,7],
      wHpPct:[3,3.75,4.5,5.25,6], wAP100:1.5, wCd:[17,17,17,17,17],
      eFlat:[70,110,150,190,230], eAP:0.65, eSlow:[40,45,50,55,60], eCd:[12,12,12,12,12],
      rFlat:[100,140,180], rBonusAD:0.75, rAP:[0.35,0.4,0.45], rMax:[200,280,360], rMaxBonusAD:1.5, rMaxAP:[0.7,0.8,0.9], rCd:[2,1.5,1]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Caustic Spittle */
      A.qAS = R(T.qAS,qr);
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Bio-Arcane Barrage */
      A.wHpPct = R(T.wHpPct,wr) + T.wAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      /* E — Void Ooze */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Living Artillery */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + R(T.rAP,rr)*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD + R(T.rMaxAP,rr)*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qAS=0; A.qDmg=0; }
      if(!learned.w){ A.wHpPct=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Icathian Surprise","Surprise d'Icathia"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Caustic Spittle", fr:"Q — Bave caustique"},
      {id:"w", kind:"spell", en:"W — Bio-Arcane Barrage", fr:"W — Barrage bio-arcanique"},
      {id:"e", kind:"spell", en:"E — Void Ooze", fr:"E — Limon du Néant"},
      {id:"r", kind:"spell", en:"R — Living Artillery", fr:"R — Artillerie vivante"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"causticSpittle", v:A.qDmg, type:"magic"});
        out.asBonus = A.qAS;
      }
      if(st.id === "w") out.parts.push({n:"bioArcaneBarrage", v:hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"voidOoze", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"livingArtillery", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("bonusAs"), val:"+" + pc(A.qAS)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Resistances Reduction : ligne non modelisee (16 to 32%)
   - W / Bonus Attack Range : ligne non modelisee (130 to 210)
   - R : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
