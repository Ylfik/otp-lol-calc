/* vladimir — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Vladimir.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"vladimir", name:"Vladimir", label:"Vladimir", splash:0,
    base:{hp:[600,110], mana:[2,0], ad:[55,3],
          ar:[24,4.5], mr:[30,1.3],
          as:0.658, asPerLevel:2, ms:330},
    abilities_meta:[
      {k:"q", en:"Transfusion", fr:"Transfusion"},
      {k:"w", en:"Sanguine Pool", fr:"Bain de sang"},
      {k:"e", en:"Tides of Blood", fr:"Vagues de sang"},
      {k:"r", en:"Hemoplague", fr:"Peste sanguine"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,100,120,140,160], qAP:0.6, qHeal:[20,25,30,35,40], qHealAP:0.35, qMax:[148,185,222,259,296], qMaxAP:1.11, qCd:[9,7.9,6.8,5.7,4.6],
      wFlat:[80,135,190,245,300], wBonusHp:0.15, wCd:[28,25,22,19,16],
      eFlat:[30,45,60,75,90], eMaxHp:0.015, eAP:0.35, eMax:[60,90,120,150,180], eMaxMaxHp:0.06, eMaxAP:0.8, eSlow:[40,45,50,55,60], eCd:[13,11,9,7,5],
      rFlat:[150,250,350], rAP:0.7, rHeal:[150,250,350], rHealAP:0.7, rHealReduced:[60,100,140], rHealReducedAP:0.28, rHealMax:[390,650,910], rHealMaxAP:1.82, rCd:[120,120,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Transfusion */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qHeal = R(T.qHeal,qr) + T.qHealAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      /* W — Sanguine Pool */
      A.wDmg = R(T.wFlat,wr) + T.wBonusHp*bonusHP;
      /* E — Tides of Blood */
      A.eDmg = R(T.eFlat,er) + T.eMaxHp*tot.hp + T.eAP*ap;
      A.eMax = R(T.eMax,er) + T.eMaxMaxHp*tot.hp + T.eMaxAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Hemoplague */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rHeal = R(T.rHeal,rr) + T.rHealAP*ap;
      A.rHealReduced = R(T.rHealReduced,rr) + T.rHealReducedAP*ap;
      A.rHealMax = R(T.rHealMax,rr) + T.rHealMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHeal=0; A.qMax=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eMax=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rHeal=0; A.rHealReduced=0; A.rHealMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Crimson Pact","Pacte de sang"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Transfusion", fr:"Q — Transfusion"},
      {id:"w", kind:"spell", en:"W — Sanguine Pool", fr:"W — Bain de sang"},
      {id:"e", kind:"spell", en:"E — Tides of Blood", fr:"E — Vagues de sang"},
      {id:"r", kind:"spell", en:"R — Hemoplague", fr:"R — Peste sanguine"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"transfusion", v:A.qDmg, type:"magic"});
        out.heal = A.qHeal;
      }
      if(st.id === "w") out.parts.push({n:"sanguinePool", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"tidesOfBlood", v:A.eDmg, type:"magic"});
      if(st.id === "r"){
        out.parts.push({n:"hemoplague", v:A.rDmg, type:"magic"});
        out.heal = A.rHeal;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("healing"), val:n0(A.rHealReduced)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage Per Tick : ligne non modelisee (20 to 75 (+ 3.75% bonus health))
   - E : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Crimson Rush) : non modelisee
   ------------------------------------------------------------------ */
