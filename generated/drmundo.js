/* drmundo — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Dr. Mundo.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"drmundo", name:"DrMundo", label:"Dr. Mundo", splash:0,
    base:{hp:[640,103], mana:[0,0], ad:[61,2.5],
          ar:[32,4.5], mr:[29,2.3],
          as:0.67, asPerLevel:3.3, ms:345},
    abilities_meta:[
      {k:"q", en:"Infected Bonesaw", fr:"Scie souillée"},
      {k:"w", en:"Heart Zapper", fr:"Défibrillateur"},
      {k:"e", en:"Blunt Force Trauma", fr:"Contusion"},
      {k:"r", en:"Maximum Dosage", fr:"Dosage maximal"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qCurPct:[20,22.5,25,27.5,30], qMin:[80,130,180,230,280], qCd:[4,4,4,4,4],
      wTotal:[80,140,200,260,320], wFlat:[20,35,50,65,80], wBonusHp:0.07, wCd:[17,16.5,16,15.5,15],
      eFlat:[2,2.3,2.6,2.9,3.2], eMin:[5,15,25,35,45], eMinBonusHp:0.05, eMax:[7,21,35,49,63], eMaxBonusHp:0.07, eCd:[9,8.25,7.5,6.75,6],
      rMs:[15,25,35], rCd:[120,120,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Infected Bonesaw */
      A.qCurPct = R(T.qCurPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qMin = R(T.qMin,qr);
      /* W — Heart Zapper */
      A.wTotal = R(T.wTotal,wr);
      A.wDmg = R(T.wFlat,wr) + T.wBonusHp*bonusHP;
      /* E — Blunt Force Trauma */
      A.eDmg = R(T.eFlat,er);
      A.eMin = R(T.eMin,er) + T.eMinBonusHp*bonusHP;
      A.eMax = R(T.eMax,er) + T.eMaxBonusHp*bonusHP;
      /* R — Maximum Dosage */
      A.rMs = R(T.rMs,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qCurPct=0; A.qMin=0; }
      if(!learned.w){ A.wTotal=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eMin=0; A.eMax=0; }
      if(!learned.r){ A.rMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Goes Where He Pleases","Il va où il veut"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Infected Bonesaw", fr:"Q — Scie souillée"},
      {id:"w", kind:"spell", en:"W — Heart Zapper", fr:"W — Défibrillateur"},
      {id:"e", kind:"spell", en:"E — Blunt Force Trauma", fr:"E — Contusion"},
      {id:"r", kind:"cast", label:"R", en:"R — Maximum Dosage", fr:"R — Dosage maximal"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"infectedBonesaw", v:cur * A.qCurPct/100, type:"magic"});
      if(st.id === "w") out.parts.push({n:"heartZapper", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"bluntForceTrauma", v:A.eDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qCurPct)},
         {lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMin)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Infected Bonesaw, Infected Cleaver) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Heart Zapper, Burning Agony) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Blunt Force Trauma, Masochism) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Maximum Dosage, Sadism) — seule la premiere est modelisee
   - Q / Capped Monster Damage : ligne non modelisee (250 to 550)
   - W / Magic Damage per Tick : ligne non modelisee (5 to 20)
   - E / Minimum Minion Physical Damage : ligne non modelisee (5*1.4 to 45*1.4 (+ 5*1.4% bonus health))
   - E / Maximum Minion Physical Damage : ligne non modelisee (5*1.4*1.4 to 45*1.4*1.4 (+ 5*1.4*1.4% bonus health))
   - E / Minimum Monster Physical Damage : ligne non modelisee (5*1.4 to 45*1.4 (+ 5*1.4% bonus health))
   - E / Maximum Monster Physical Damage : ligne non modelisee (5*1.4*1.4 to 45*1.4*1.4 (+ 5*1.4*1.4% bonus health))
   - R / Increased Base Health : ligne non modelisee (15 to 25% missing health)
   - R / Bonus Health Regeneration : ligne non modelisee (20/2 to 60/2% maximum health)
   - R / Health Regenerated per 0.5 Seconds : ligne non modelisee (20/20 to 60/20% maximum health)
   - R / Total Health Regenerated : ligne non modelisee (20 to 60% maximum health)
   - passif : 2 blocs dans le wiki (Goes Where He Pleases, Adrenaline Rush) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Health) : non modelisee
   ------------------------------------------------------------------ */
