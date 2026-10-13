/* rumble — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Rumble.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"rumble", name:"Rumble", label:"Rumble", splash:0,
    base:{hp:[640,105], mana:[150,0], ad:[64,3.2],
          ar:[36,4.7], mr:[28,1.55],
          as:0.644, asPerLevel:1.85, ms:345},
    abilities_meta:[
      {k:"q", en:"Flamespitter", fr:"Lance-flammes"},
      {k:"w", en:"Scrap Shield", fr:"Bouclier recyclé"},
      {k:"e", en:"Electro Harpoon", fr:"Harpon électrique"},
      {k:"r", en:"The Equalizer", fr:"Éradication"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[12.5,18.75,25,31.25,37.5], qAP:0.2625, qHpPct:[1.5,1.625,1.75,1.875,2], qMax:[62.5,93.75,125,156.25,187.5], qMaxAP:1.3125, qMaxHpPct:[7.5,8.125,8.75,9.375,10], qMin:[18.75,28.125,37.5,46.875,56.25], qMinAP:0.39375, qMinHpPct:[2.25,2.4375,2.625,2.8125,3], qCd:[10,9,8,7,6],
      wShield:[25,55,85,115,145], wShieldAP:0.3, wShieldMaxHp:0.04, wMs:[10,15,20,25,30], wShieldMax:[37.5,82.5,127.5,172.5,217.5], wShieldMaxAP:0.45, wShieldMaxMaxHp:0.06, wMsMax:[15,22.5,30,37.5,45], wCd:[6,6,6,6,6],
      eFlat:[55,80,105,130,155], eAP:0.5, eTotal:[110,160,210,260,310], eTotalAP:1, eSlow:[15,20,25,30,35], eSlowTotal:[30,40,50,60,70], eMax:[82.5,120,157.5,195,232.5], eMaxAP:0.75, eSlowMax:[22.5,30,37.5,45,52.5], eSlowSlow:[45,60,75,90,105], eCd:[0.5,0.5,0.5,0.5,0.5],
      rFlat:[600,1000,1400], rAP:1.75, rCd:[130,105,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Flamespitter */
      A.qHpPct = R(T.qHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMaxHpPct = R(T.qMaxHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      A.qMinHpPct = R(T.qMinHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qMin = R(T.qMin,qr) + T.qMinAP*ap;
      /* W — Scrap Shield */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap + T.wShieldMaxHp*tot.hp;
      A.wMs = R(T.wMs,wr);
      A.wShieldMax = R(T.wShieldMax,wr) + T.wShieldMaxAP*ap + T.wShieldMaxMaxHp*tot.hp;
      A.wMsMax = R(T.wMsMax,wr);
      /* E — Electro Harpoon */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      A.eSlow = R(T.eSlow,er);
      A.eSlowTotal = R(T.eSlowTotal,er);
      A.eMax = R(T.eMax,er) + T.eMaxAP*ap;
      A.eSlowMax = R(T.eSlowMax,er);
      A.eSlowSlow = R(T.eSlowSlow,er);
      /* R — The Equalizer */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qDmg=0; A.qMaxHpPct=0; A.qMax=0; A.qMinHpPct=0; A.qMin=0; }
      if(!learned.w){ A.wShield=0; A.wMs=0; A.wShieldMax=0; A.wMsMax=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; A.eSlow=0; A.eSlowTotal=0; A.eMax=0; A.eSlowMax=0; A.eSlowSlow=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Junkyard Titan","Titan de bric-à-brac"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Flamespitter", fr:"Q — Lance-flammes"},
      {id:"w", kind:"cast", label:"W", en:"W — Scrap Shield", fr:"W — Bouclier recyclé"},
      {id:"e", kind:"spell", en:"E — Electro Harpoon", fr:"E — Harpon électrique"},
      {id:"r", kind:"spell", en:"R — The Equalizer", fr:"R — Éradication"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"flamespitter", v:A.qDmg + hp * A.qHpPct/100 + hp * A.qMaxHpPct/100 + hp * A.qMinHpPct/100, type:"magic"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e") out.parts.push({n:"electroHarpoon", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"theEqualizer", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("mPpct"), val:pc(A.qMaxHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("shield"), val:n0(A.wShieldMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
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
   - Q : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - Q / Magic Damage per Second : ligne non modelisee ((50/12)*4 to (150/12)*4 (+ (105/12)*4% AP) (+ (6/12)*4 to (8/12)*4% of target's maximum health)<!-- -->)
   - Q / Magic Damage per Tick : ligne non modelisee (50/12 to 150/12 (+ 105/12% AP) (+ 6/12 to 8/12% of target's maximum health)<!-- -->)
   - Q / Minimum Minion Damage : ligne non modelisee ((50/12)*3*0.7 to (150/12)*3*0.7 (+ (105/12)*3*0.7% AP) (+ (6/12)*3*0.7 to (8/12)*3*0.7% of target's maximum health)<!-- -->)
   - Q / Minion Damage per Second : ligne non modelisee ((50/12)*4*0.7 to (150/12)*4*0.7 (+ (105/12)*4*0.7% AP) (+ (6/12)*4*0.7 to (8/12)*4*0.7% of target's maximum health)<!-- -->)
   - Q / Minion Damage per Tick : ligne non modelisee ((50/12)*0.7 to (150/12)*0.7 (+ (105*0.7)/12% AP) (+ (6/12)*0.7 to (8/12)*0.7% of target's maximum health)<!-- -->)
   - Q / Maximum Minion Damage : ligne non modelisee (50*(15/12)*0.7 to 150*(15/12)*0.7 (+ 105*(15/12)*0.7% AP) (+ 6*(15/12)*0.7 to 8*(15/12)*0.7% of target's maximum health)<!-- -->)
   - Q / Enhanced Damage per Second : ligne non modelisee ((50/12)*4*1.5 to (150/12)*4*1.5 (+ (105/12)*4*1.5% AP) (+ (6/12)*4*1.5 to (8/12)*4*1.5% of target's maximum health)<!-- -->)
   - Q / Enhanced Damage per Tick : ligne non modelisee ((50/12)*1.5 to (150/12)*1.5 (+ (105/12)*1.5% AP) (+ (6/12)*1.5 to (8/12)*1.5% of target's maximum health)<!-- -->)
   - Q / Maximum Enhanced Damage : doublon de Maximum Magic Damage, ignore
   - Q / Minimum Enhanced Minion Damage : ligne non modelisee ((50/12)*3*0.7*1.5 to (150/12)*3*0.7*1.5 (+ (105/12)*3*0.7*1.5% AP) (+ (6/12)*3*0.7*1.5 to (8/12)*3*0.7*1.5% of target's maximum health)<!-- -->)
   - Q / Enhanced Minion Damage per Second : ligne non modelisee ((50/12)*4*0.7*1.5 to (150/12)*4*0.7*1.5 (+ (105/12)*4*0.7*1.5% AP) (+ (6/12)*4*0.7*1.5 to (8/12)*4*0.7*1.5% of target's maximum health)<!-- -->)
   - Q / Enhanced Minion Damage per Tick : ligne non modelisee ((50/12)*0.7*1.5 to (150/12)*0.7*1.5 (+ (105/12)*0.7*1.5% AP) (+ (6/12)*0.7*1.5 to (8/12)*0.7*1.5% of target's maximum health)<!-- -->)
   - Q / Maximum Enhanced Minion Damage : ligne non modelisee (50*(15/12)*0.7*1.5 to 150*(15/12)*0.7*(15/12)*1.5 (+ 105*(15/12)*0.7*1.5% AP) (+ 6*(15/12)*0.7*1.5 to 8*(15/12)*0.7*1.5% of target's maximum health)<!-- -->)
   - E / Magic Resistance Reduction : ligne non modelisee (10 to 18%)
   - E / Total MR Reduction : ligne non modelisee (10*2 to 18*2%)
   - E / Total Enhanced Damage : doublon de Total Magic Damage, ignore
   - E / Enhanced Magic Resistance Reduction : ligne non modelisee (10*1.5 to 18*1.5%)
   - E / Total Enhanced MR Reduction : ligne non modelisee (10*1.5*2 to 18*1.5*2%)
   - R : pas de ligne de degats simple, « Maximum Magic Damage » prise comme ligne principale
   - R / Magic Damage per Tick : ligne non modelisee (120/4 to 280/4 (+ 35/4% AP))
   - R / Magic Damage per Second : ligne non modelisee (120 to 280 (+ 35% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Heat) : non modelisee
   ------------------------------------------------------------------ */
