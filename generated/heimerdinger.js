/* heimerdinger — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Heimerdinger.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"heimerdinger", name:"Heimerdinger", label:"Heimerdinger", splash:0,
    base:{hp:[558,105], mana:[385,20], ad:[56,2.7],
          ar:[19,4.2], mr:[30,1.3],
          as:0.658, asPerLevel:1.36, ms:340},
    abilities_meta:[
      {k:"q", en:"H-28 G Evolution Turret", fr:"Tourelle H-28G Évolution"},
      {k:"w", en:"Hextech Micro-Rockets", fr:"Micro-roquettes Hextech"},
      {k:"e", en:"CH-2 Electron Storm Grenade", fr:"Grenade électro-tempête CH-2"},
      {k:"r", en:"UPGRADE!!!", fr:"AMÉLIORATION !"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qCd:[1,1,1,1,1],
      wMin:[50,75,100,125,150], wMinAP:0.55, wFlat:[10,15,20,25,30], wAP:0.12, wCd:[11,10,9,8,7],
      eFlat:[60,100,140,180,220], eAP:0.6, eCd:[11,11,11,11,11],
      rCd:[100,85,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* W — Hextech Micro-Rockets */
      A.wMin = R(T.wMin,wr) + T.wMinAP*ap;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — CH-2 Electron Storm Grenade */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.w){ A.wMin=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Hextech Affinity","Affinité Hextech"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"w", kind:"spell", en:"W — Hextech Micro-Rockets", fr:"W — Micro-roquettes Hextech"},
      {id:"e", kind:"spell", en:"E — CH-2 Electron Storm Grenade", fr:"E — Grenade électro-tempête CH-2"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "w") out.parts.push({n:"hextechMicroRockets", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"ch2ElectronStormGrenade", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wMin)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (H-28G Evolution Turret, H-28Q Apex Turret) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Hextech Micro-Rockets, Hextech Rocket Swarm) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (CH-2 Electron Storm Grenade, CH-3X Lightning Grenade) — seule la premiere est modelisee
   - W / Total Subsequent Non-Minion Damage : ligne non modelisee (4*10 to 4*30 (+ 4*12% AP))
   - W / Combined Total Non-Minion Damage : ligne non modelisee (50+4*10 to 150+4*30 (+ 55+4*12% AP))
   - W / Subsequent Rocket Minion Damage : ligne non modelisee (10*3.0 to 30*3.0 (+ 12*3.0% AP))
   - W / Total Subsequent Minion Damage : ligne non modelisee (4*10*3.0 to 4*30*3.0 (+ 4*12*3.0% AP))
   - W / Combined Total Minion Damage : ligne non modelisee (50+4*10*3.0 to 150+4*30*3.0 (+ 55+4*12*3.0% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - Q : « H-28G Evolution Turret » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence
   ------------------------------------------------------------------ */
