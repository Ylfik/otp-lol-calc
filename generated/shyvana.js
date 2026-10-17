/* shyvana — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Shyvana.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"shyvana", name:"Shyvana", label:"Shyvana", splash:0,
    base:{hp:[625,95], mana:[100,0], ad:[62,4],
          ar:[35,4], mr:[32,2.05],
          as:0.638, asPerLevel:2, ms:350},
    abilities_meta:[
      {k:"q", en:"Emberstrike", fr:"Frappe enflammée"},
      {k:"w", en:"Inferno Aegis", fr:"Égide de feu"},
      {k:"e", en:"Molten Burst", fr:"Éruption"},
      {k:"r", en:"Dragon's Descent", fr:"Vol du dragon"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[10,15,20,25,30], qAD:1.1, qAP:0.3, qCd:[10,9,8,7,6],
      wShield:[60,80,100,120,140], wShieldBonusHp:0.12, wFlat:[80,100,120,140,160], wAP:0.65, wCd:[13,12.25,11.5,10.75,10],
      eFlat:[50,65,80,95,110], eAP:[0.6,0.65,0.7,0.75,0.8], eHpPct:5, eMax:[62.5,81.25,100,118.75,137.5], eMaxAP:[0.75,0.8125,0.875,0.9375,1], eMaxHpPct:6.25, eSubsequent:[25,32.5,40,47.5,55], eSubsequentAP:[0.3,0.325,0.35,0.375,0.4], eSubsequentHpPct:2.5, eCd:[12,11,10,9,8],
      rFlat:[150,250,350], rAP:1
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Emberstrike */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad + T.qAP*ap;
      /* W — Inferno Aegis */
      A.wShield = R(T.wShield,wr) + T.wShieldBonusHp*bonusHP;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Molten Burst */
      A.eHpPct = T.eHpPct;   /* % des PV de la cible, applique dans onStep */
      A.eDmg = R(T.eFlat,er) + R(T.eAP,er)*ap;
      A.eMaxHpPct = T.eMaxHpPct;   /* % des PV de la cible, applique dans onStep */
      A.eMax = R(T.eMax,er) + R(T.eMaxAP,er)*ap;
      A.eSubsequentHpPct = T.eSubsequentHpPct;   /* % des PV de la cible, applique dans onStep */
      A.eSubsequent = R(T.eSubsequent,er) + R(T.eSubsequentAP,er)*ap;
      /* R — Dragon's Descent */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; A.wDmg=0; }
      if(!learned.e){ A.eHpPct=0; A.eDmg=0; A.eMaxHpPct=0; A.eMax=0; A.eSubsequentHpPct=0; A.eSubsequent=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Scalemail","Armure d'écailles"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Emberstrike", fr:"Q — Frappe enflammée"},
      {id:"w", kind:"spell", en:"W — Inferno Aegis", fr:"W — Égide de feu"},
      {id:"e", kind:"spell", en:"E — Molten Burst", fr:"E — Éruption"},
      {id:"r", kind:"spell", en:"R — Dragon's Descent", fr:"R — Vol du dragon"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"emberstrike", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"infernoAegis", v:A.wDmg, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"moltenBurst", v:A.eDmg + hp * A.eHpPct/100 + hp * A.eMaxHpPct/100 + hp * A.eSubsequentHpPct/100, type:"magic"});
      if(st.id === "r") out.parts.push({n:"dragonSDescent", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("mPpct"), val:pc(A.eMaxHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Emberstrike, Twin Bite) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Inferno Aegis, Burnout) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Molten Burst, Flame Breath) — seule la premiere est modelisee
   - Q / True Damage : doublon de Area Physical Damage, ignore
   - W / Increased shield per champion : ligne non modelisee (60*0.3 to 140*0.3 (+ 12*0.3% bonus health))
   - R / Dragon Fury Generation per 0.5 Seconds : ligne non modelisee (0.5/2 to 1/2)
   - R / Dragon Fury Generation per Second : ligne non modelisee (0.5 to 1)
   - R / Bonus Health : ligne non modelisee (150 to 350)
   - R / Bonus Range : ligne non modelisee (25 to 75)
   - R / Size Increase : ligne non modelisee (5 to 20%)
   - R : aucune recharge dans les donnees wiki
   - passif : 2 blocs dans le wiki (Scalemail, Fury of the Dragonborn) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Fury) : non modelisee
   ------------------------------------------------------------------ */
