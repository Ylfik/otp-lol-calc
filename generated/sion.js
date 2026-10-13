/* sion — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Sion.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"sion", name:"Sion", label:"Sion", splash:0,
    base:{hp:[655,87], mana:[400,52], ad:[68,4],
          ar:[36,4.2], mr:[32,2.05],
          as:0.679, asPerLevel:1.3, ms:345},
    abilities_meta:[
      {k:"q", en:"Decimating Smash", fr:"Fracas meurtrier"},
      {k:"w", en:"Soul Furnace", fr:"Feu intérieur"},
      {k:"e", en:"Roar of the Slayer", fr:"Cri du tueur"},
      {k:"r", en:"Unstoppable Onslaught", fr:"Assaut inarrêtable"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qIncPctMax:[200,244.444444,266.666667,280,288.888889], qFlat:[30,45,60,75,90], qAD:[0.4,0.5,0.6,0.7,0.8], qMax:[90,155,220,285,350], qMaxAD:[1.2,1.5,1.8,2.1,2.4], qCd:[10,9,8,7,6],
      wShield:[60,75,90,105,120], wShieldAP:0.4, wShieldMaxHp:[0.08,0.1,0.12,0.14,0.16], wFlat:[40,65,90,115,140], wAP:0.4, wHpPct:14, wCd:[15,14,13,12,11],
      eFlat:[65,100,135,170,205], eAP:0.55, eSlow:[40,45,50,55,60], eCd:[12,11,10,9,8],
      rFlat:[150,300,450], rBonusAD:0.6, rMax:[400,800,1200], rMaxBonusAD:1.2, rSlow:[40,45,50], rCd:[140,100,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Decimating Smash */
      A.qDmg = R(T.qFlat,qr) + R(T.qAD,qr)*tot.ad;
      A.qMax = R(T.qMax,qr) + R(T.qMaxAD,qr)*tot.ad;
      A.qIncMax = A.qDmg * (1 + (R(T.qIncPctMax,qr))/100);
      /* W — Soul Furnace */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap + R(T.wShieldMaxHp,wr)*tot.hp;
      A.wHpPct = T.wHpPct;   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Roar of the Slayer */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Unstoppable Onslaught */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD;
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; A.qIncMax=0; }
      if(!learned.w){ A.wShield=0; A.wHpPct=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; A.rSlow=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Glory in Death","Gloire posthume"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Decimating Smash", fr:"Q — Fracas meurtrier"},
      {id:"w", kind:"spell", en:"W — Soul Furnace", fr:"W — Feu intérieur"},
      {id:"e", kind:"spell", en:"E — Roar of the Slayer", fr:"E — Cri du tueur"},
      {id:"r", kind:"spell", en:"R — Unstoppable Onslaught", fr:"R — Assaut inarrêtable"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"decimatingSmash", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"soulFurnace", v:A.wDmg + hp * A.wHpPct/100, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"roarOfTheSlayer", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"unstoppableOnslaught", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("damage"), val:n0(A.qIncMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Minimum Physical Damage » prise comme ligne principale
   - Q / Minimum Monster Damage : ligne non modelisee (30*1.65 to 90*1.65 (+ 40*1.65 to 80*1.65% AD))
   - Q / Maximum Monster Damage : ligne non modelisee (90*1.65 to 350*1.65 (+ 40*1.65*3 to 80*1.65*3% AD))
   - Q / Minimum Minion Damage : ligne non modelisee (30*0.6 to 90*0.6 (+ 40*0.6 to 80*0.6% AD))
   - Q / Maximum Minion Damage : ligne non modelisee (90*0.6 to 350*0.6 (+ 40*0.6*3 to 80*0.6*3% AD))
   - R : pas de ligne de degats simple, « Minimum Physical Damage » prise comme ligne principale
   - passif : 2 blocs dans le wiki (Glory in Death, Death Surge) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
