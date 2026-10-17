/* twitch — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Twitch.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"twitch", name:"Twitch", label:"Twitch", splash:0,
    base:{hp:[630,98], mana:[300,40], ad:[59,3],
          ar:[27,4], mr:[33,1.1],
          as:0.679, asPerLevel:3, ms:330},
    abilities_meta:[
      {k:"q", en:"Ambush", fr:"Embuscade"},
      {k:"w", en:"Venom Cask", fr:"Dose de venin"},
      {k:"e", en:"Contaminate", fr:"Contamination"},
      {k:"r", en:"Spray and Pray", fr:"Panique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qAS:[40,45,50,55,60], qCd:[16,16,16,16,16],
      wSlow:[30,35,40,45,50], wSlowAP100:6, wCd:[13,12,11,10,9],
      eFlat:[20,30,40,50,60], ePerStack:[15,20,25,30,35], ePerStackBonusAD:0.35, eMin:[35,50,65,80,95], eMinBonusAD:0.35, eMinAP:0.35, eMax:[110,150,190,230,270], eMaxBonusAD:2.1, eMaxAP:2.1, eCd:[12,11,10,9,8],
      rFlat:[30,45,60], rCd:[90,90,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Ambush */
      A.qAS = R(T.qAS,qr);
      /* W — Venom Cask */
      A.wSlow = R(T.wSlow,wr) + T.wSlowAP100*ap/100;
      /* E — Contaminate */
      A.eDmg = R(T.eFlat,er);
      A.ePerStack = R(T.ePerStack,er) + T.ePerStackBonusAD*bonusAD;
      A.eMin = R(T.eMin,er) + T.eMinBonusAD*bonusAD + T.eMinAP*ap;
      A.eMax = R(T.eMax,er) + T.eMaxBonusAD*bonusAD + T.eMaxAP*ap;
      /* R — Spray and Pray */
      A.rDmg = R(T.rFlat,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qAS=0; }
      if(!learned.w){ A.wSlow=0; }
      if(!learned.e){ A.eDmg=0; A.ePerStack=0; A.eMin=0; A.eMax=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Deadly Venom","Venin mortel"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"cast", label:"Q", en:"Q — Ambush", fr:"Q — Embuscade"},
      {id:"w", kind:"cast", label:"W", en:"W — Venom Cask", fr:"W — Dose de venin"},
      {id:"e", kind:"spell", en:"E — Contaminate", fr:"E — Contamination"},
      {id:"r", kind:"spell", en:"R — Spray and Pray", fr:"R — Panique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.asBonus = A.qAS;
      if(st.id === "e") out.parts.push({n:"contaminate", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"sprayAndPray", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("bonusAs"), val:"+" + pc(A.qAS)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.ePerStack)},
         {lab:TR("damage"), val:n0(A.eMin)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Stealth Duration : ligne non modelisee (10 to 14 seconds)
   - E : pas de ligne de degats simple, « Base Physical Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
