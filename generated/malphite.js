/* malphite — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Malphite.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"malphite", name:"Malphite", label:"Malphite", splash:0,
    base:{hp:[665,104], mana:[280,60], ad:[62,4],
          ar:[40,4.95], mr:[28,2.05],
          as:0.736, asPerLevel:3.4, ms:335},
    abilities_meta:[
      {k:"q", en:"Seismic Shard", fr:"Éclat sismique"},
      {k:"w", en:"Thunderclap", fr:"Coup de tonnerre"},
      {k:"e", en:"Ground Slam", fr:"Choc au sol"},
      {k:"r", en:"Unstoppable Force", fr:"Force indomptable"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,120,170,220,270], qAP:0.6, qSlow:[20,25,30,35,40], qCd:[8,8,8,8,8],
      wFlat:[30,40,50,60,70], wAP:0.2, wArmor:0.15, wCd:[10,9.5,9,8.5,8],
      eFlat:[60,95,130,165,200], eAP:0.6, eArmor:0.4, eCd:[7,7,7,7,7],
      rFlat:[200,300,400], rAP:0.9, rCd:[130,115,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Seismic Shard */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qSlow = R(T.qSlow,qr);
      /* W — Thunderclap */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap + T.wArmor*tot.ar;
      /* E — Ground Slam */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap + T.eArmor*tot.ar;
      /* R — Unstoppable Force */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Granite Shield","Bouclier de granit"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Seismic Shard", fr:"Q — Éclat sismique"},
      {id:"w", kind:"spell", en:"W — Thunderclap", fr:"W — Coup de tonnerre"},
      {id:"e", kind:"spell", en:"E — Ground Slam", fr:"E — Choc au sol"},
      {id:"r", kind:"spell", en:"R — Unstoppable Force", fr:"R — Force indomptable"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"seismicShard", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"thunderclap", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"groundSlam", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"unstoppableForce", v:A.rDmg, type:"magic"});
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
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Thunderclap, Brutal Strikes) — seule la premiere est modelisee
   - W / Bonus Armor : ligne non modelisee (10 to 30% armor)
   - W / Increased Bonus Armor : ligne non modelisee (10*3 to 30*3% armor)
   - W / Additional Physical Damage : « 15% armor » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - W / Physical Damage : doublon de Additional Physical Damage, ignore
   - E / Magic Damage : « 40% armor » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - E / Cripple Strength : ligne non modelisee (30 to 50%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
