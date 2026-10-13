/* cassiopeia — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Cassiopeia.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"cassiopeia", name:"Cassiopeia", label:"Cassiopeia", splash:0,
    base:{hp:[610,98], mana:[450,40], ad:[53,3],
          ar:[18,4.7], mr:[32,1.3],
          as:0.647, asPerLevel:1.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Noxious Blast", fr:"Bombe nocive"},
      {k:"w", en:"Miasma", fr:"Miasmes"},
      {k:"e", en:"Twin Fang", fr:"Morsure fatale"},
      {k:"r", en:"Petrifying Gaze", fr:"Regard de la Méduse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[65,100,135,170,205], qAP:0.75, qMs:[30,35,40,45,50], qCd:[3.5,3.5,3.5,3.5,3.5],
      wFlat:[100,125,150,175,200], wAP:0.5, wSlow:[40,50,60,70,80], wCd:[24,22,20,18,16],
      eFlat:[20,45,70,95,120], eAP:0.45, eTotalAdd:[20,45,70,95,120], eTotalAP:0.65, eHeal:[10,11.5,13,14.5,16], eHealReduced:[2.5,2.875,3.25,3.625,4], eCd:[0.75,0.75,0.75,0.75,0.75],
      rFlat:[125,225,325], rAP:0.75, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Noxious Blast */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMs = R(T.qMs,qr);
      /* W — Miasma */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wSlow = R(T.wSlow,wr);
      /* E — Twin Fang */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eTotal = lerp(50,120,L) + R(T.eTotalAdd,er) + T.eTotalAP*ap;
      A.eHeal = (R(T.eHeal,er))/100*ap;
      A.eHealReduced = (R(T.eHealReduced,er))/100*ap;
      /* R — Petrifying Gaze */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMs=0; }
      if(!learned.w){ A.wDmg=0; A.wSlow=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; A.eHeal=0; A.eHealReduced=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Serpentine Grace","Grâce serpentine"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Noxious Blast", fr:"Q — Bombe nocive"},
      {id:"w", kind:"spell", en:"W — Miasma", fr:"W — Miasmes"},
      {id:"e", kind:"spell", en:"E — Twin Fang", fr:"E — Morsure fatale"},
      {id:"r", kind:"spell", en:"R — Petrifying Gaze", fr:"R — Regard de la Méduse"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"noxiousBlast", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"miasma", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"twinFang", v:A.eDmg, type:"magic"});
        out.heal = A.eHeal;
      }
      if(st.id === "r") out.parts.push({n:"petrifyingGaze", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.qMs)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("healing"), val:n0(A.eHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - Q / Magic Damage Per Tick : ligne non modelisee (65/7 to 205/7 (+ 75/7% AP))
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage Per Second : ligne non modelisee (20 to 40 (+ 10% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - R : « Petrifying Gaze » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence
   ------------------------------------------------------------------ */
