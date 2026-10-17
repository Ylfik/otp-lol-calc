/* kalista — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kalista.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kalista", name:"Kalista", label:"Kalista", splash:0,
    base:{hp:[560,114], mana:[300,45], ad:[57,4.75],
          ar:[24,5.2], mr:[33,1.1],
          as:0.694, asPerLevel:4.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Pierce", fr:"Perforation"},
      {k:"w", en:"Sentinel", fr:"Sentinelle"},
      {k:"e", en:"Rend", fr:"Extirpation"},
      {k:"r", en:"Fate's Call", fr:"Appel du destin"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[10,75,140,205,270], qAD:1.05, qCd:[9,9,9,9,9],
      wHpPct:[10,12,14,16,18], wCd:[30,30,30,30,30],
      eFlat:[5,15,25,35,45], eAD:0.7, eAP:0.65, eSlow:[10,18,26,34,42], eSlowAP100:5, eCd:[10,9.5,9,8.5,8],
      rCc:[1,1.5,2], rCd:[160,140,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Pierce */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Sentinel */
      A.wHpPct = R(T.wHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      /* E — Rend */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad + T.eAP*ap;
      A.eSlow = R(T.eSlow,er) + T.eSlowAP100*ap/100;
      /* R — Fate's Call */
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wHpPct=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Martial Poise","Maintien martial"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Pierce", fr:"Q — Perforation"},
      {id:"w", kind:"spell", en:"W — Sentinel", fr:"W — Sentinelle"},
      {id:"e", kind:"spell", en:"E — Rend", fr:"E — Extirpation"},
      {id:"r", kind:"cast", label:"R", en:"R — Fate's Call", fr:"R — Appel du destin"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"pierce", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"sentinel", v:hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"rend", v:A.eDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « A » pour Basic Attack
   - W / Maximum Non-Champion Damage : ligne non modelisee (100 to 200)
   - E / Bonus Damage per Additional Stack : ligne non modelisee (7 to 35 (+ 20 to 50% AD) (+ 50% AP))
   - E / Mana Restored : ligne non modelisee (10 to 30)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
