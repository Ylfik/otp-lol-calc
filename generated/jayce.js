/* jayce — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Jayce.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"jayce", name:"Jayce", label:"Jayce", splash:0,
    base:{hp:[590,109], mana:[375,45], ad:[59,4.25],
          ar:[22,5], mr:[30,1.3],
          as:0.658, asPerLevel:3, ms:335},
    abilities_meta:[
      {k:"q", en:"To the Skies! / Shock Blast", fr:"Direction le ciel ! / Orbe électrique"},
      {k:"w", en:"Lightning Field / Hyper Charge", fr:"Champ électrique / Hypercharge"},
      {k:"e", en:"Thundering Blow / Acceleration Gate", fr:"Coup foudroyant / Portail d'accélération"},
      {k:"r", en:"Mercury Cannon / Mercury Hammer", fr:"Canon Mercury / Marteau Mercury"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,110,160,210,260,310], qBonusAD:1.35, qSlow:[35,40,45,50,55,60], qCd:[16,14,12,10,8,6],
      wFlat:[140,200,260,320,380,440], wAP:1, wCd:[10,10,10,10,10],
      eHpPct:[8,10.8,13.6,16.4,19.2,22], eBonusAD:1, eCd:[20,18,16,14,12,10],
      rCd:[6,6,6]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — To the Skies! / Shock Blast */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qSlow = R(T.qSlow,qr);
      /* W — Lightning Field / Hyper Charge */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Thundering Blow / Acceleration Gate */
      A.eHpPct = R(T.eHpPct,er) + T.eBonusAD*bonusAD;   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eHpPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Hextech Capacitor","Capaciteur Hextech"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — To the Skies! / Shock Blast", fr:"Q — Direction le ciel ! / Orbe électrique"},
      {id:"w", kind:"spell", en:"W — Lightning Field / Hyper Charge", fr:"W — Champ électrique / Hypercharge"},
      {id:"e", kind:"spell", en:"E — Thundering Blow / Acceleration Gate", fr:"E — Coup foudroyant / Portail d'accélération"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"toTheSkiesShockBlast", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"lightningFieldHyperCharge", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"thunderingBlowAccelerationGate", v:hp * A.eHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « {{DATA JAYCE/HEXTECH CAPACITOR|PST2|SKILL}} » pour Hextech Capacitor 2
   - Q : 2 formes dans le wiki (To the Skies!, Shock Blast) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Lightning Field, Hyper Charge) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Thundering Blow, Acceleration Gate) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Transform Mercury Cannon, Transform Mercury Hammer) — seule la premiere est modelisee
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Mana Restored : ligne non modelisee (15 to 25 6)
   - W / Magic Damage Per Tick : ligne non modelisee (35 to 110 6 (+ 25% AP))
   - E / Capped Monster Damage : ligne non modelisee (200 to 700 6)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - une table a six rangs : ce kit ne suit pas le schema 5/5/5/3, rankCap a revoir
   ------------------------------------------------------------------ */
