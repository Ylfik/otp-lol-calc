/* ekko — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",     kind:"attack", en:"Auto attack",     fr:"Auto-attaque"},
      {id:"aaDive", kind:"attack", dive:true, en:"Auto, Phase Dive", fr:"Auto, Plongée"},
      {id:"aaLow",  kind:"attack", low:true, en:"Auto, target under 30%", fr:"Auto, cible sous 30 %"},
      {id:"q", kind:"spell", en:"Q — Timewinder",           fr:"Q — Rétrobang"},
      {id:"w", kind:"cast",  label:"W", en:"W — Parallel Convergence", fr:"W — Convergence parallèle"},
      {id:"e", kind:"cast",  label:"E", en:"E — Phase Dive", fr:"E — Rush déphasé"},
      {id:"r", kind:"spell", en:"R — Chronobreak",          fr:"R — Chronofracture"}
    ],
    key:"ekko", name:"Ekko", splash:19,
    base:{hp:[655,99], mana:[280,70], ad:[58,3], ar:[32,4.2], mr:[32,2.05],
          as:0.688, asPerLevel:3.3, ms:340},
    abilities_meta:[
      {k:"q", en:"Timewinder", fr:"Rétrobang"},
      {k:"w", en:"Parallel Convergence", fr:"Convergence parallèle"},
      {k:"e", en:"Phase Dive", fr:"Rush déphasé"},
      {k:"r", en:"Chronobreak", fr:"Chronofracture"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qOut:   [80,95,110,125,140],   qOutAP:0.30,
      qBack:  [40,65,90,115,140],    qBackAP:0.60,
      qSlow:  [40,45,50,55,60],
      wShield:[100,120,140,160,180], wAP:1.50,
      wLowPct:3,        /* % of missing health on-hit, below 30% of the target's maximum */
      wLowMin:15,
      eDmg:   [50,75,100,125,150],   eAP:0.40,
      rDmg:   [200,350,500],         rAP:1.75,
      rHealMin:[100,150,200],        rHealMinAP:0.60,
      rHealMax:[400,600,800],        rHealMaxAP:2.40,
      qCd:[9,8.5,8,7.5,7], wCd:[22,20,18,16,14], eCd:[9,8.5,8,7.5,7], rCd:[110,80,50]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, lerp, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap;
      A.qOut   = R(T.qOut,qr)  + T.qOutAP*ap;
      A.qBack  = R(T.qBack,qr) + T.qBackAP*ap;
      A.qTotal = A.qOut + A.qBack;
      A.qSlow  = R(T.qSlow,qr);
      A.wShield= R(T.wShield,wr) + T.wAP*ap;
      /* Parallel Convergence also empowers attacks against a wounded target */
      A.wLowPct = T.wLowPct + 3*ap/100;
      A.wLowMin = T.wLowMin;
      A.eDmg   = R(T.eDmg,er)  + T.eAP*ap;
      A.rDmg   = R(T.rDmg,rr)  + T.rAP*ap;
      A.rHealMin = R(T.rHealMin,rr) + T.rHealMinAP*ap;
      A.rHealMax = R(T.rHealMax,rr) + T.rHealMaxAP*ap;
      /* Z-Drive Resonance: the third stack consumes them all */
      A.reso   = lerp(30,150,L) + 0.80*ap;
      A.resoMs = L >= 16 ? 80 : L >= 11 ? 70 : L >= 6 ? 60 : 50;
      const ah = 1 + tot.ah/100;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qOut=0; A.qBack=0; A.qTotal=0; }
      if(!learned.w){ A.wShield=0; A.wLowPct=0; }
      if(!learned.e) A.eDmg=0;
      if(!learned.r){ A.rDmg=0; A.rHealMin=0; A.rHealMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    /* Resonance counts hits, so the combo needs a memory */
    newState(){ return {stacks:0}; },
    combos:[],
    onStep(key, st, c){
      const {A, memo, onHits, hp, cur} = c, out = {parts:[]};
      let marks = 0;
      if(st.kind === "attack"){
        marks = onHits;                                   /* doubled by Dusk and Dawn */
        if(st.dive) out.parts.push({n:"phaseDive", v:A.eDmg, type:"magic"});
        /* the W's on-hit only lands once the target is under 30% of its health */
        if(A.wLowPct && (st.low || cur < 0.30 * hp)){
          const miss = st.low ? Math.max(hp - cur, 0.70 * hp) : hp - cur;
          out.parts.push({n:"wLowHit", v:Math.max(A.wLowMin, miss * A.wLowPct/100), type:"magic"});
        }
      }
      if(st.kind === "cast" && st.id === "w") out.shield = A.wShield;
      if(st.kind === "spell"){
        marks = 1;
        if(st.id === "q") out.parts.push({n:"timewinder", v:A.qTotal, type:"magic"});
        if(st.id === "r"){
          out.parts.push({n:"chronobreak", v:A.rDmg, type:"magic"});
          out.heal = A.rHealMin;                          /* the floor; the ceiling is shown apart */
        }
      }
      /* every third mark consumes the set */
      for(let i = 0; i < marks; i++){
        memo.stacks++;
        if(memo.stacks >= 3){
          memo.stacks = 0;
          out.parts.push({n:"resonance", v:A.reso, type:"magic"});
        }
      }
      return out;
    },
    comboEnd(){ return {parts:[]}; },
    castNote(st){
      if(st.id === "w") return isFR() ? "Convergence parallèle — bouclier et zone ralentissante"
                                      : "Parallel Convergence — shield and slowing zone";
      return isFR() ? "Plongée — dash, prépare l'attaque suivante"
                    : "Phase Dive — dash, empowers the next attack";
    },
    passiveName:["Z-Drive Resonance","RéZonance"],
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [
        {lab:TR("kReso"),   val:n0(A.reso)},
        {lab:TR("kResoMs"), val:"+" + pc(A.resoMs)},
        {lab:TR("kMarks"),  val:"3"}
      ];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("kQout"), val:n0(A.qOut)}, {lab:TR("kQback"), val:n0(A.qBack)},
         {lab:TR("kQtotal"), val:n0(A.qTotal), awk:true},
         {lab:TR("slow"), val:pc(A.qSlow)}, {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("kWlow"), val:pc(A.wLowPct), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("kEdmg"), val:n0(A.eDmg)}, {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("kRmin"), val:n0(A.rHealMin), awk:true},
         {lab:TR("kRmax"), val:n0(A.rHealMax), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    comboRows(key, x){
      const {c, A, TR, n0} = x;
      return [
        {lab:TR("damage"), val:n0(c.dmg), hi:true},
        {lab:TR("dps"), val:n0(c.dps)},
        {lab:TR("healing"), val:n0(c.heal), dim:c.heal < 1},
        {lab:TR("shielding"), val:n0(c.shield), dim:c.shield < 1},
        {lab:TR("kReso"), val:n0(A.reso)},
        {lab:TR("targetLeft"), val:n0(c.leftover)}];
    }
  };
