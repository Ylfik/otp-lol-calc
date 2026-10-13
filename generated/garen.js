/* garen — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Garen.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"garen", name:"Garen", label:"Garen", splash:0,
    base:{hp:[690,98], mana:[0,0], ad:[69,4.5],
          ar:[38,4.2], mr:[32,1.55],
          as:0.625, asPerLevel:3.65, ms:340},
    abilities_meta:[
      {k:"q", en:"Decisive Strike", fr:"Coup décisif"},
      {k:"w", en:"Courage", fr:"Courage"},
      {k:"e", en:"Judgment", fr:"Jugement"},
      {k:"r", en:"Demacian Justice", fr:"Justice de Demacia"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qMs:[1.4,1.95,2.5,3.05,3.6], qFlat:[30,60,90,120,150], qAD:0.5, qCd:[8,8,8,8,8],
      wShield:[65,85,105,125,145], wShieldBonusHp:0.18, wCd:[22,19.5,17,14.5,12],
      eCd:[9,8.25,7.5,6.75,6],
      rFlat:[125,200,275], rMissPct:[25,30,35], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Decisive Strike */
      A.qMs = R(T.qMs,qr);
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Courage */
      A.wShield = R(T.wShield,wr) + T.wShieldBonusHp*bonusHP;
      /* R — Demacian Justice */
      A.rMissPct = R(T.rMissPct,rr);   /* % des PV de la cible, applique dans onStep */
      A.rDmg = R(T.rFlat,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qMs=0; A.qDmg=0; }
      if(!learned.w){ A.wShield=0; }
      if(!learned.r){ A.rMissPct=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Perseverance","Persévérance"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Decisive Strike", fr:"Q — Coup décisif"},
      {id:"w", kind:"cast", label:"W", en:"W — Courage", fr:"W — Courage"},
      {id:"r", kind:"spell", en:"R — Demacian Justice", fr:"R — Justice de Demacia"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"decisiveStrike", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "r") out.parts.push({n:"demacianJustice", v:A.rDmg + Math.max(0, hp - cur) * A.rMissPct/100, type:"true"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("msBonus"), val:"+" + pc(A.qMs)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rMissPct)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « A » pour Basic Attack
   - W / Damage Reduction : ligne non modelisee (25 to 41%)
   - E / Physical Damage Per Spin : ligne non modelisee (4 to 16 (+ 40 to 52% AD))
   - E / Critical Strike Damage Per Spin : ligne non modelisee (4*(1+0.3) to 16*(1+0.3) (+ 40*(1+0.3) to 52*(1+0.3)% AD))
   - E / Infinity Edge Damage Per Spin : ligne non modelisee ({{ap|4*(1+{{#expr:*0.3/100}}+0.3) to 16*(1+{{#expr:*0.3/100}}+0.3)}} {{as|(+ {{ap|40*(1+{{#expr:*0.3/100}}+0.3) to 52*(1+{{#expr:*0.3/100}}+0.3)}}% AD)}})
   - E / Increased Damage Per Spin : ligne non modelisee (4*1.25 to 16*1.25 (+ 40*1.25 to 52*1.25% AD))
   - E / Increased Critical Strike Damage Per Spin : ligne non modelisee (4*1.25*(1+0.3) to 16*1.25*(1+0.3) (+ 40*1.25*(1+0.3) to 52*1.25*(1+0.3)% AD))
   - E / Increased Infinity Edge Damage Per Spin : ligne non modelisee ({{ap|4*1.25*(1+{{#expr:*0.3/100}}+0.3) to 16*1.25*(1+{{#expr:*0.3/100}}+0.3)}} {{as|(+ {{ap|40*1.25*(1+{{#expr:*0.3/100}}+0.3) to 52*1.25*(1+{{#expr:*0.3/100}}+0.3)}}% AD)}})
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
