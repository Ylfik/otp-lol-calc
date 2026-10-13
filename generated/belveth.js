/* belveth — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Bel'Veth.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"belveth", name:"Belveth", label:"Bel'Veth", splash:0,
    base:{hp:[580,105], mana:[0,0], ad:[55,1.5],
          ar:[28,5], mr:[32,2.05],
          as:0.67, asPerLevel:0, ms:340},
    abilities_meta:[
      {k:"q", en:"Void Surge", fr:"Charge du Néant"},
      {k:"w", en:"Above and Below", fr:"Projection cinglante"},
      {k:"e", en:"Royal Maelstrom", fr:"Maelström impérial"},
      {k:"r", en:"Endless Banquet", fr:"Banquet infini"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[12,14,16,18,20], qAD:1.05, qCd:[4,3.25,2.5,1.75,1],
      wFlat:[80,140,200,260,320], wAP:1.5, wCd:[12,11,10,9,8],
      eCd:[24,21,18,15,12],
      rFlat:[2,4,6], rBonusAD:0.03, rASMax:[6,13,20], rHeal:[100,250,400], rHealBonusAD:1.5, rHealAP:1.5, rCd:[1,1,1]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Void Surge */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Above and Below */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* R — Endless Banquet */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rASMax = R(T.rASMax,rr);
      A.rHeal = R(T.rHeal,rr) + T.rHealBonusAD*bonusAD + T.rHealAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rASMax=0; A.rHeal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Death in Lavender ","Mer de lavande "],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Void Surge", fr:"Q — Charge du Néant"},
      {id:"w", kind:"spell", en:"W — Above and Below", fr:"W — Projection cinglante"},
      {id:"r", kind:"spell", en:"R — Endless Banquet", fr:"R — Banquet infini"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"voidSurge", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"aboveAndBelow", v:A.wDmg, type:"magic"});
      if(st.id === "r"){
        out.parts.push({n:"endlessBanquet", v:A.rDmg, type:"true"});
        out.heal = A.rHeal;
        out.asBonus = A.rASMax;
      }
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
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("bonusAs"), val:"+" + pc(A.rASMax)},
         {lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Knock Up Duration : ligne non modelisee (0.6 to 1 seconds)
   - E / Damage Reduction : ligne non modelisee (20 to 60%)
   - E / Life Steal : ligne non modelisee (20 to 40%)
   - E / Minimum Physical Damage per hit : ligne non modelisee (10 to 18 (+ 12% AD))
   - E / Maximum Physical Damage per hit : ligne non modelisee (10*2 to 18*2 (+ 12*2% AD))
   - E / Minimum Monster Damage per hit : ligne non modelisee (10*2 to 18*2 (+ 12*2% AD))
   - E / Maximum Monster Damage per hit : ligne non modelisee (10*2*2 to 18*2*2 (+ 12*2*2% AD))
   - R / Maximum Monster Damage : ligne non modelisee (2*8 to 6*8 (+ 3*8% bonus AD))
   - R / True Damage : doublon de Bonus True Damage, ignore
   - R / Bonus Health : ligne non modelisee (100 to 400 (+ 150% bonus AD) (+ 150% AP))
   - R / Bonus Attack Range : ligne non modelisee (25 to 125)
   - R / Increased Size : ligne non modelisee (10 to 20%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
