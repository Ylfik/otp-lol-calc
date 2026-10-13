/* sona — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Sona.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"sona", name:"Sona", label:"Sona", splash:0,
    base:{hp:[550,91], mana:[340,45], ad:[49,3],
          ar:[26,4.2], mr:[30,1.3],
          as:0.644, asPerLevel:2.3, ms:325},
    abilities_meta:[
      {k:"q", en:"Hymn of Valor", fr:"Hymne à la bravoure"},
      {k:"w", en:"Aria of Perseverance", fr:"Aria de persévérance"},
      {k:"e", en:"Song of Celerity", fr:"Mélodie de vélocité"},
      {k:"r", en:"Crescendo", fr:"Crescendo"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[50,85,120,155,190], qAP:0.4, qCd:[8,8,8,8,8],
      wHeal:[30,45,60,75,90], wHealAP:0.3, wShield:[25,45,65,85,105], wShieldAP:0.25, wFlat:[25,45,65,85,105], wCd:[10,10,10,10,10],
      eMs:[10,12,14,16,18], eMsAP:0.02, eCd:[14,14,14,14,14],
      rFlat:[150,250,350], rAP:0.5, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Hymn of Valor */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Aria of Perseverance */
      A.wHeal = R(T.wHeal,wr) + T.wHealAP*ap;
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap;
      A.wDmg = R(T.wFlat,wr);
      /* E — Song of Celerity */
      A.eMs = R(T.eMs,er) + T.eMsAP*ap;
      /* R — Crescendo */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wHeal=0; A.wShield=0; A.wDmg=0; }
      if(!learned.e){ A.eMs=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Power Chord","Accord de puissance"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Hymn of Valor", fr:"Q — Hymne à la bravoure"},
      {id:"w", kind:"spell", en:"W — Aria of Perseverance", fr:"W — Aria de persévérance"},
      {id:"e", kind:"cast", label:"E", en:"E — Song of Celerity", fr:"E — Mélodie de vélocité"},
      {id:"r", kind:"spell", en:"R — Crescendo", fr:"R — Crescendo"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"hymnOfValor", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"ariaOfPerseverance", v:A.wDmg, type:"magic"});
        out.heal = A.wHeal;
        out.shield = A.wShield;
      }
      if(st.id === "r") out.parts.push({n:"crescendo", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHeal)},
         {lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.eMs)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Bonus Magic Damage : doublon de Magic Damage, ignore
   - W : pas de ligne de degats simple, « Minimum Damage Mitigated » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
