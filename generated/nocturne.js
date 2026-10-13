/* nocturne — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Nocturne.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"nocturne", name:"Nocturne", label:"Nocturne", splash:0,
    base:{hp:[640,109], mana:[275,35], ad:[62,2.6],
          ar:[36,4.2], mr:[32,1.55],
          as:0.721, asPerLevel:2.7, ms:345},
    abilities_meta:[
      {k:"q", en:"Duskbringer", fr:"Crépuscule"},
      {k:"w", en:"Shroud of Darkness", fr:"Linceul des ténèbres"},
      {k:"e", en:"Unspeakable Horror", fr:"Horreur indicible"},
      {k:"r", en:"Paranoia", fr:"Paranoïa"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[65,105,145,185,225], qBonusAD:0.85, qAttack:[15,25,35,45,55], qMs:[20,25,30,35,40], qCd:[8,8,8,8,8],
      wAS:[30,35,40,45,50], wASMax:[60,70,80,90,100], wCd:[20,18,16,14,12],
      eFlat:[80,125,170,215,260], eAP:1, eCc:[1.25,1.5,1.75,2,2.25], eCd:[15,14,13,12,11],
      rFlat:[150,275,400], rBonusAD:1.2, rCd:[160,130,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Duskbringer */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qAttack = R(T.qAttack,qr);
      A.qMs = R(T.qMs,qr);
      /* W — Shroud of Darkness */
      A.wAS = R(T.wAS,wr);
      A.wASMax = R(T.wASMax,wr);
      /* E — Unspeakable Horror */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eCc = R(T.eCc,er);
      /* R — Paranoia */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qAttack=0; A.qMs=0; }
      if(!learned.w){ A.wAS=0; A.wASMax=0; }
      if(!learned.e){ A.eDmg=0; A.eCc=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Umbra Blades","Lames d'ombre"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Duskbringer", fr:"Q — Crépuscule"},
      {id:"w", kind:"cast", label:"W", en:"W — Shroud of Darkness", fr:"W — Linceul des ténèbres"},
      {id:"e", kind:"spell", en:"E — Unspeakable Horror", fr:"E — Horreur indicible"},
      {id:"r", kind:"spell", en:"R — Paranoia", fr:"R — Paranoïa"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"duskbringer", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "e") out.parts.push({n:"unspeakableHorror", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"paranoia", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qAttack)},
         {lab:TR("msBonus"), val:"+" + pc(A.qMs)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("bonusAs"), val:"+" + pc(A.wASMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - E / Magic Damage per Tick : ligne non modelisee (80/4 to 260/4 (+ 100/4% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
