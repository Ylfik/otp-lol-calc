/* chogath — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    key:"chogath", name:"Chogath", label:"Cho'Gath", splash:0,
    base:{hp:[644,94], mana:[270,60], ad:[69,4.2], ar:[38,4.5], mr:[32,2.05],
          as:0.658, asPerLevel:1.44, ms:345},
    abilities_meta:[
      {k:"q", en:"Rupture", fr:"Rupture"},
      {k:"w", en:"Feral Scream", fr:"Cri sauvage"},
      {k:"e", en:"Vorpal Spikes", fr:"Piques vorpales"},
      {k:"r", en:"Feast", fr:"Festin"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    /* Feast stacks are a build choice, so they get their own control */
    stacks:{max:99, def:6, en:"Feast stacks", fr:"charges de Festin"},
    ranks:{
      qFlat:[80,135,190,245,300], qAP:1.00,
      wFlat:[80,130,180,230,280], wAP:0.70, wSilence:[1.6,1.7,1.8,1.9,2.0],
      eFlat:[20,40,60,80,100], eAP:0.30, ePct:[2.5,2.85,3.2,3.55,3.9], ePctPerStack:0.5,
      eSlow:[30,35,40,45,50],
      rDmg:[300,475,650], rAP:0.50, rHpPct:10, rPerStack:[80,120,160],
      qCd:[6,6,6,6,6], wCd:[11,10.5,10,9.5,9], eCd:[8,7,6,5,4], rCd:[80,70,60]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      const n = c.stacks || 0;
      A.feast   = n;
      A.feastHP = R(T.rPerStack, rr) * n;
      tot.hp += A.feastHP;                      /* those stacks are real health */
      const bonusHP = tot.hp - c.base.hp + A.feastHP;
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wSilence = R(T.wSilence,wr);
      A.eFlat = R(T.eFlat,er) + T.eAP*ap;
      A.ePct  = R(T.ePct,er) + T.ePctPerStack * n;
      A.eSlow = R(T.eSlow,er);
      A.rDmg  = R(T.rDmg,rr) + T.rAP*ap + T.rHpPct/100 * bonusHP;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q) A.qDmg = 0;
      if(!learned.w){ A.wDmg = 0; A.wSilence = 0; }
      if(!learned.e){ A.eFlat = 0; A.ePct = 0; }
      if(!learned.r){ A.rDmg = 0; A.feastHP = 0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Carnivore","Carnivore"],
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("cFeastHp"), val:n0(A.feastHP)}, {lab:TR("cFeast"), val:n0(A.feast)}];
    },
    stepMenu:[
      {id:"aa",  kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"aaE", kind:"attack", spikes:true, en:"Auto, Vorpal Spikes", fr:"Auto, Piques vorpales"},
      {id:"q", kind:"spell", en:"Q — Rupture", fr:"Q — Rupture"},
      {id:"w", kind:"spell", en:"W — Feral Scream", fr:"W — Cri sauvage"},
      {id:"e", kind:"cast", label:"E", en:"E — Vorpal Spikes", fr:"E — Piques vorpales"},
      {id:"r", kind:"spell", en:"R — Feast", fr:"R — Festin"}
    ],
    onStep(key, st, c){
      const {A, hp} = c, out = {parts:[]};
      if(st.kind === "attack" && st.spikes)
        out.parts.push({n:"vorpalSpikes", v:A.eFlat + hp*A.ePct/100, type:"magic"});
      if(st.id === "q") out.parts.push({n:"rupture", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"feralScream", v:A.wDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"feast", v:A.rDmg, type:"true"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}, {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)}, {lab:TR("cSilence"), val:nf1.format(A.wSilence)+" s"},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eFlat)}, {lab:TR("cSpikePct"), val:pc(A.ePct), awk:true},
         {lab:TR("slow"), val:pc(A.eSlow)}, {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cTrue"), val:n0(A.rDmg)}, {lab:TR("cFeastHp"), val:n0(A.feastHP), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
