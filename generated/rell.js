/* rell — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Rell.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"rell", name:"Rell", label:"Rell", splash:0,
    base:{hp:[620,104], mana:[320,40], ad:[55,3],
          ar:[30,4], mr:[28,1.8],
          as:0.625, asPerLevel:2, ms:315},
    abilities_meta:[
      {k:"q", en:"Shattering Strike", fr:"Frappe dislocatrice"},
      {k:"w", en:"Ferromancy: Crash Down", fr:"Ferromancie : Descendre en piqué"},
      {k:"e", en:"Full Tilt", fr:"Joute endiablée"},
      {k:"r", en:"Magnet Storm", fr:"Tempête magnétique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,100,140,180,220], qAP:0.6, qCd:[11,10.5,10,9.5,9],
      wMs:[20,25,30,35,40], wShield:[20,40,60,80,100], wShieldMaxHp:0.11, wFlat:[60,90,120,150,180], wAP:0.6, wCd:[10,10,10,10,10],
      eHpPct:[5,5.5,6,6.5,7], eAP100:3, eCd:[14,13,12,11,10],
      rFlat:[150,250,350], rAP:1.1, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Shattering Strike */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Ferromancy: Crash Down */
      A.wMs = R(T.wMs,wr);
      A.wShield = R(T.wShield,wr) + T.wShieldMaxHp*tot.hp;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Full Tilt */
      A.eHpPct = R(T.eHpPct,er) + T.eAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      /* R — Magnet Storm */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wMs=0; A.wShield=0; A.wDmg=0; }
      if(!learned.e){ A.eHpPct=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Break the Mold","Mise en pièces"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Shattering Strike", fr:"Q — Frappe dislocatrice"},
      {id:"w", kind:"spell", en:"W — Ferromancy: Crash Down", fr:"W — Ferromancie : Descendre en piqué"},
      {id:"e", kind:"spell", en:"E — Full Tilt", fr:"E — Joute endiablée"},
      {id:"r", kind:"spell", en:"R — Magnet Storm", fr:"R — Tempête magnétique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"shatteringStrike", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"ferromancyCrashDown", v:A.wDmg, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"fullTilt", v:hp * A.eHpPct/100, type:"magic"});
      if(st.id === "r") out.parts.push({n:"magnetStorm", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Ferromancy: Crash Down, Ferromancy: Mount Up) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Full Tilt, Attract and Repel) — seule la premiere est modelisee
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Magic Damage Per Tick : ligne non modelisee (150/8 to 350/8 (+ 110/8% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
