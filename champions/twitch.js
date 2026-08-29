/* twitch — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    key:"twitch", name:"Twitch", splash:0,
    base:{hp:[630,98], mana:[300,40], ad:[59,3], ar:[27,4], mr:[33,1.1],
          as:0.679, asPerLevel:3, ms:330},
    abilities_meta:[
      {k:"q", en:"Ambush",        fr:"Embuscade"},
      {k:"w", en:"Venom Cask", fr:"Dose de venin"},
      {k:"e", en:"Contaminate",   fr:"Contamination"},
      {k:"r", en:"Spray and Pray", fr:"Panique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    /* Deadly Venom stacks on the target, up to six */
    stacks:{max:6, def:6, en:"Venom stacks", fr:"charges de venin"},
    ranks:{
      qAS:[40,45,50,55,60],
      wSlow:[30,35,40,45,50], wSlowAP:6,
      eBase:[20,30,40,50,60], ePerStack:[15,20,25,30,35], eStackAD:0.35,
      rAD:[30,45,60],
      qCd:[16,16,16,16,16], wCd:[13,12,11,10,9], eCd:[12,11,10,9,8], rCd:[90,90,90]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, bonusAD, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      const n = c.stacks || 0;
      A.venom   = n;
      A.qAS     = R(T.qAS,qr);
      A.wSlow   = R(T.wSlow,wr) + T.wSlowAP*ap/100;
      A.ePerSt  = R(T.ePerStack,er) + T.eStackAD*bonusAD;
      A.eDmg    = R(T.eBase,er) + A.ePerSt * n;
      A.rAD     = R(T.rAD,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q) A.qAS = 0;
      if(!learned.w) A.wSlow = 0;
      if(!learned.e){ A.eDmg = 0; A.ePerSt = 0; }
      if(!learned.r) A.rAD = 0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Deadly Venom","Venin mortel"],
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("twVenom"), val:n0(A.venom)}, {lab:TR("twPerStack"), val:n0(A.ePerSt)}];
    },
    stepMenu:[
      {id:"aa",  kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"aaR", kind:"attack", spray:true, en:"Auto, Spray and Pray", fr:"Auto, Tir en rafale"},
      {id:"q", kind:"cast", label:"Q", en:"Q — Ambush", fr:"Q — Embuscade"},
      {id:"w", kind:"spell", en:"W — Venom Cask", fr:"W — Dose de venin"},
      {id:"e", kind:"spell", en:"E — Contaminate", fr:"E — Contamination"},
      {id:"r", kind:"cast", label:"R", en:"R — Spray and Pray", fr:"R — Panique"}
    ],
    onStep(key, st, c){
      const {A, tot} = c, out = {parts:[]};
      if(st.id === "q") out.asBonus = A.qAS;
      if(st.id === "e") out.parts.push({n:"contaminate", v:A.eDmg, type:"phys"});
      if(st.kind === "attack" && st.spray)
        out.parts.push({n:"sprayAndPray", v:A.rAD, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("bonusAs"), val:"+" + pc(A.qAS)}, {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.wSlow)}, {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("twPerStack"), val:n0(A.ePerSt), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("twRad"), val:"+" + n0(A.rAD)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
};
