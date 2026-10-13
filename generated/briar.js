/* briar — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Briar.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"briar", name:"Briar", label:"Briar", splash:0,
    base:{hp:[625,95], mana:[0,0], ad:[60,2.5],
          ar:[30,4.5], mr:[32,2.05],
          as:0.644, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Head Rush", fr:"À table !"},
      {k:"w", en:"Blood Frenzy / Snack Attack", fr:"Folie sanguinaire / Juste un croc"},
      {k:"e", en:"Chilling Scream", fr:"Cri sanglant"},
      {k:"r", en:"Certain Death", fr:"Vol mortel"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,85,110,135,160], qBonusAD:0.8, qAP:0.6, qCd:[13,12,11,10,9],
      wAS:[55,65,75,85,95], wMs:[24,33,42,51,60], wFlat:[60,70,80,90,100], wCd:[14,13,12,11,10],
      eHealMax:[10,11.5,13,14.5,16], eMax:[80,115,150,185,220], eMaxBonusAD:1, eMaxAP:1, eMin:[2,2.875,3.75,4.625,5.5], eMinBonusAD:0.025, eMinAP:0.025, eFlat:[140,215,290,365,440], eBonusAD:2.4, eAP:2.4, eTotal:[220,330,440,550,660], eTotalBonusAD:3.4, eTotalAP:3.4, eCd:[16,16,16,16,16],
      rFlat:[150,250,350], rAP:1.3, rMs:[10,20,30], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Head Rush */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      /* W — Blood Frenzy / Snack Attack */
      A.wAS = R(T.wAS,wr);
      A.wMs = R(T.wMs,wr);
      A.wDmg = (R(T.wFlat,wr))/100*tot.ad;
      /* E — Chilling Scream */
      A.eHealMax = R(T.eHealMax,er);
      A.eMax = R(T.eMax,er) + T.eMaxBonusAD*bonusAD + T.eMaxAP*ap;
      A.eMin = R(T.eMin,er) + T.eMinBonusAD*bonusAD + T.eMinAP*ap;
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD + T.eTotalAP*ap;
      /* R — Certain Death */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rMs = R(T.rMs,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wAS=0; A.wMs=0; A.wDmg=0; }
      if(!learned.e){ A.eHealMax=0; A.eMax=0; A.eMin=0; A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; A.rMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Crimson Curse","Malédiction écarlate"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Head Rush", fr:"Q — À table !"},
      {id:"w", kind:"spell", en:"W — Blood Frenzy / Snack Attack", fr:"W — Folie sanguinaire / Juste un croc"},
      {id:"e", kind:"spell", en:"E — Chilling Scream", fr:"E — Cri sanglant"},
      {id:"r", kind:"spell", en:"R — Certain Death", fr:"R — Vol mortel"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"headRush", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"bloodFrenzySnackAttack", v:A.wDmg, type:"phys"});
        out.asBonus = A.wAS;
      }
      if(st.id === "e"){
        out.parts.push({n:"chillingScream", v:A.eDmg, type:"magic"});
        out.heal = A.eHealMax;
      }
      if(st.id === "r") out.parts.push({n:"certainDeath", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.eHealMax)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("damage"), val:n0(A.eMin)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Blood Frenzy, Snack Attack) — seule la premiere est modelisee
   - Q / Resistances Reduction : ligne non modelisee (10 to 20%)
   - E / Heal Per Tick : ligne non modelisee (10/4 to 16/4% maximum health)
   - R / Life Steal : ligne non modelisee (10 to 20%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Frenzy) : non modelisee
   ------------------------------------------------------------------ */
