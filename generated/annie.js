/* annie — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Annie.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"annie", name:"Annie", label:"Annie", splash:0,
    base:{hp:[560,96], mana:[418,25], ad:[50,2.65],
          ar:[23,4], mr:[30,1.3],
          as:0.61, asPerLevel:1.36, ms:335},
    abilities_meta:[
      {k:"q", en:"Disintegrate", fr:"Désintégration"},
      {k:"w", en:"Incinerate", fr:"Incinération"},
      {k:"e", en:"Molten Shield", fr:"Bouclier en fusion"},
      {k:"r", en:"Summon: Tibbers", fr:"Invocation : Tibbers"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,125,170,215,260], qAP:0.8, qCd:[4,4,4,4,4],
      wFlat:[70,110,150,190,230], wAP:0.8, wCd:[7,7,7,7,7],
      eShield:[60,95,130,165,200], eShieldAP:0.4, eFlat:[25,35,45,55,65], eAP:0.4, eCd:[10,10,10,10,10],
      rPen:[10,15,20], rFlat:[150,275,400], rAP:0.75, rCd:[130,115,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Disintegrate */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Incinerate */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Molten Shield */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Summon: Tibbers */
      A.rPen = R(T.rPen,rr);
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eShield=0; A.eDmg=0; }
      if(!learned.r){ A.rPen=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Pyromania","Pyromanie"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Disintegrate", fr:"Q — Désintégration"},
      {id:"w", kind:"spell", en:"W — Incinerate", fr:"W — Incinération"},
      {id:"e", kind:"spell", en:"E — Molten Shield", fr:"E — Bouclier en fusion"},
      {id:"r", kind:"spell", en:"R — Summon: Tibbers", fr:"R — Invocation : Tibbers"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"disintegrate", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"incinerate", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"moltenShield", v:A.eDmg, type:"magic"});
        out.shield = A.eShield;
      }
      if(st.id === "r") out.parts.push({n:"summonTibbers", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPen"), val:pc(A.rPen)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R : pas de ligne de degats simple, « Initial Magic Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - R : « Summon: Tibbers » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence
   ------------------------------------------------------------------ */
