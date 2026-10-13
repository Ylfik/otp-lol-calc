/* khazix — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kha'Zix.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"khazix", name:"Khazix", label:"Kha'Zix", splash:0,
    base:{hp:[643,99], mana:[327,40], ad:[60,3.1],
          ar:[32,4.2], mr:[32,2.05],
          as:0.668, asPerLevel:2.7, ms:345},
    abilities_meta:[
      {k:"q", en:"Taste Their Fear", fr:"Goût de la peur"},
      {k:"w", en:"Void Spike", fr:"Pique du Néant"},
      {k:"e", en:"Leap", fr:"Bond"},
      {k:"r", en:"Void Assault", fr:"Assaut du Néant"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,105,130,155,180], qBonusAD:1.05, qIsolated:[168,220.5,273,325.5,378], qIsolatedBonusAD:2.205, qCd:[4,4,4,4,4],
      wFlat:[75,105,135,165,195], wBonusAD:1, wHeal:[55,75,95,115,135], wHealAP:0.5, wCd:[9,9,9,9,9],
      eFlat:[65,100,135,170,205], eBonusAD:0.4, eCd:[20,18,16,14,12],
      rCd:[100,85,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Taste Their Fear */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qIsolated = R(T.qIsolated,qr) + T.qIsolatedBonusAD*bonusAD;
      /* W — Void Spike */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      A.wHeal = R(T.wHeal,wr) + T.wHealAP*ap;
      /* E — Leap */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qIsolated=0; }
      if(!learned.w){ A.wDmg=0; A.wHeal=0; }
      if(!learned.e){ A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Unseen Threat","Menace invisible"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Taste Their Fear", fr:"Q — Goût de la peur"},
      {id:"w", kind:"spell", en:"W — Void Spike", fr:"W — Pique du Néant"},
      {id:"e", kind:"spell", en:"E — Leap", fr:"E — Bond"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"tasteTheirFear", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"voidSpike", v:A.wDmg, type:"phys"});
        out.heal = A.wHeal;
      }
      if(st.id === "e") out.parts.push({n:"leap", v:A.eDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qIsolated)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("healing"), val:n0(A.wHeal)},
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
   - Q : 2 formes dans le wiki (Taste Their Fear, Evolved Reaper Claws) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Void Spike, Evolved Spike Racks) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Leap, Evolved Wings) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Void Assault, Evolved Adaptive Cloaking) — seule la premiere est modelisee
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
