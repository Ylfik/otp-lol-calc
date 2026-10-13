/* gragas — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Gragas.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"gragas", name:"Gragas", label:"Gragas", splash:0,
    base:{hp:[640,115], mana:[400,47], ad:[64,3.5],
          ar:[38,5], mr:[32,2.05],
          as:0.675, asPerLevel:2.05, ms:330},
    abilities_meta:[
      {k:"q", en:"Barrel Roll", fr:"Fût roulant"},
      {k:"w", en:"Drunken Rage", fr:"Rage d'ivrogne"},
      {k:"e", en:"Body Slam", fr:"Coup de bidon"},
      {k:"r", en:"Explosive Cask", fr:"Fût explosif"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qAP:0.8, qMax:[120,180,240,300,360], qMaxAP:1.2, qSlowMin:[40,45,50,55,60], qSlowMax:[60,67.5,75,82.5,90], qCd:[10,9,8,7,6],
      wFlat:[20,50,80,110,140], wHpPct:7, wAP:0.7, wCd:[5,5,5,5,5],
      eFlat:[80,125,170,215,260], eAP:0.6, eCd:[14,13.5,13,12.5,12],
      rFlat:[200,300,400], rAP:0.8, rCd:[100,85,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Barrel Roll */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      A.qSlowMin = R(T.qSlowMin,qr);
      A.qSlowMax = R(T.qSlowMax,qr);
      /* W — Drunken Rage */
      A.wHpPct = T.wHpPct;   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Body Slam */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Explosive Cask */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; A.qSlowMin=0; A.qSlowMax=0; }
      if(!learned.w){ A.wHpPct=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Happy Hour","Tournée"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Barrel Roll", fr:"Q — Fût roulant"},
      {id:"w", kind:"spell", en:"W — Drunken Rage", fr:"W — Rage d'ivrogne"},
      {id:"e", kind:"spell", en:"E — Body Slam", fr:"E — Coup de bidon"},
      {id:"r", kind:"spell", en:"R — Explosive Cask", fr:"R — Fût explosif"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"barrelRoll", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"drunkenRage", v:A.wDmg + hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"bodySlam", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"explosiveCask", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("slow"), val:pc(A.qSlowMin)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wDmg)},
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
   - Q : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - Q / Minimum Minion Damage : ligne non modelisee (80*0.7 to 240*0.7 (+ 56% AP))
   - Q / Maximum Minion Damage : ligne non modelisee (80*1.5*0.7 to 240*1.5*0.7 (+ 84% AP))
   - W / Damage Reduction : ligne non modelisee (10 to 26% (+ 4% per 100 AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
