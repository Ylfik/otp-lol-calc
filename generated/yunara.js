/* yunara — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Yunara.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"yunara", name:"Yunara", label:"Yunara", splash:0,
    base:{hp:[590,110], mana:[275,45], ad:[55,3],
          ar:[25,4.4], mr:[33,1.1],
          as:0.65, asPerLevel:2, ms:325},
    abilities_meta:[
      {k:"q", en:"Cultivation of Spirit", fr:"Déchaînement spirituel"},
      {k:"w", en:"Arc of Judgment | Arc of Ruin", fr:"Arc du jugement | Arc de la ruine"},
      {k:"e", en:"Kanmei's Steps | Untouchable Shadow", fr:"Célérité des kanmei | Ombres ineffables"},
      {k:"r", en:"Transcend One's Self", fr:"Transe"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[5,10,15,20,25], qAP:0.2, qAS:[20,30,40,50,60], qActive:[5,10,15,20,25], qActiveAP:0.2, qCombined:[10,20,30,40,50], qCombinedAP:0.4,
      wFlat:[55,95,135,175,215], wBonusAD:0.85, wAP:0.5, wTotal:[33,57,81,105,129], wTotalBonusAD:0.51, wTotalAP:0.3, wCd:[10,10,10,10,10],
      eMs:[30,35,40,45,50], eMsMax:[45,52.5,60,67.5,75], eCd:[9,9,9,9,9],
      rFlat:[160,320,480], rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Cultivation of Spirit */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qAS = R(T.qAS,qr);
      A.qActive = R(T.qActive,qr) + T.qActiveAP*ap;
      A.qCombined = R(T.qCombined,qr) + T.qCombinedAP*ap;
      /* W — Arc of Judgment | Arc of Ruin */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      A.wTotal = (R(T.wTotal,wr))/100*bonusAD + T.wTotalBonusAD*bonusAD + T.wTotalAP*ap;
      /* E — Kanmei's Steps | Untouchable Shadow */
      A.eMs = R(T.eMs,er);
      A.eMsMax = R(T.eMsMax,er);
      /* R — Transcend One's Self */
      A.rDmg = R(T.rFlat,rr);
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qAS=0; A.qActive=0; A.qCombined=0; }
      if(!learned.w){ A.wDmg=0; A.wTotal=0; }
      if(!learned.e){ A.eMs=0; A.eMsMax=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Vow of the First Lands","Serment aux Terres premières"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Cultivation of Spirit", fr:"Q — Déchaînement spirituel"},
      {id:"w", kind:"spell", en:"W — Arc of Judgment | Arc of Ruin", fr:"W — Arc du jugement | Arc de la ruine"},
      {id:"e", kind:"cast", label:"E", en:"E — Kanmei's Steps | Untouchable Shadow", fr:"E — Célérité des kanmei | Ombres ineffables"},
      {id:"r", kind:"spell", en:"R — Transcend One's Self", fr:"R — Transe"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"cultivationOfSpirit", v:A.qDmg, type:"magic"});
        out.asBonus = A.qAS;
      }
      if(st.id === "w") out.parts.push({n:"arcOfJudgmentArcOfRuin", v:A.wDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"transcendOneSSelf", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("bonusAs"), val:"+" + pc(A.qAS)},
         {lab:TR("damage"), val:n0(A.qActive)}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.eMs)},
         {lab:TR("msBonus"), val:"+" + pc(A.eMsMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Active Increased Minion Damage : ligne non modelisee (5*2.5 to 25*2.5 (+ 50% AP))
   - Q / Combined Increased Minion Damage : ligne non modelisee ((5+5)*2.5 to (25+25)*2.5 (+ 100% AP))
   - Q : aucune recharge dans les donnees wiki
   - W : pas de ligne de degats simple, « Initial Magic Damage » prise comme ligne principale
   - W / Linger Magic Damage per Tick : ligne non modelisee ((55*0.6)/4 to (215*0.6)/4 (+ (85*0.6)/4% bonus AD) (+ (50*0.6)/4% AP))
   - R / 20px|border|link= Untouchable Shadow Dash Speed : ligne non modelisee (1350 to 1650)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
