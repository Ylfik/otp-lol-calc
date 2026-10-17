/* Garen — généré depuis les données du wiki.

   Perseverance ne change aucun chiffre de ce calculateur : c'est une
   régénération de vie hors combat, et la page ne compte pas la
   régénération — elle compare des dégâts et de la résistance.

     « Garen health regeneration an additional 1.5+0.2*(x-1)... of his
       maximum health every 5 seconds »
       — data/champions/Garen, passif Perseverance */
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
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
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
    l10n:{
      garenRegen:["Out-of-combat health regeneration — no effect on these numbers",
                  "Régénération de vie hors combat — sans effet sur ces chiffres"]
    },
    passiveRows(c){
      return [{lab:c.TR("garenRegen"), val:"—"}];
    },
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

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
