/* nautilus — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Nautilus.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"nautilus", name:"Nautilus", label:"Nautilus", splash:0,
    base:{hp:[646,100], mana:[400,47], ad:[58,3.3],
          ar:[39,4.95], mr:[32,2.05],
          as:0.706, asPerLevel:1, ms:325},
    abilities_meta:[
      {k:"q", en:"Dredge Line", fr:"Abordage"},
      {k:"w", en:"Titan's Wrath", fr:"Colère du titan"},
      {k:"e", en:"Riptide", fr:"Répliques"},
      {k:"r", en:"Depth Charge", fr:"Grenade ASM"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[85,125,165,205,245], qAP:0.9, qCd:[14,13,12,11,10],
      wShield:[50,60,70,80,90], wShieldMaxHp:[0.08,0.09,0.1,0.11,0.12], wFlat:[30,40,50,60,70], wAP:0.4, wCd:[12,12,12,12,12],
      eFlat:[55,90,125,160,195], eAP:0.5, eMax:[110,180,250,320,390], eMaxAP:1, eSlow:[30,35,40,45,50], eCd:[7,6.5,6,5.5,5],
      rFlat:[125,175,225], rAP:0.4, rCc:[1,1.5,2], rMax:[150,275,400], rMaxAP:0.8, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Dredge Line */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Titan's Wrath */
      A.wShield = R(T.wShield,wr) + R(T.wShieldMaxHp,wr)*tot.hp;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Riptide */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eMax = R(T.eMax,er) + T.eMaxAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Depth Charge */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rCc = R(T.rCc,rr);
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eMax=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rCc=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Staggering Blow","Coup écrasant"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Dredge Line", fr:"Q — Abordage"},
      {id:"w", kind:"spell", en:"W — Titan's Wrath", fr:"W — Colère du titan"},
      {id:"e", kind:"spell", en:"E — Riptide", fr:"E — Répliques"},
      {id:"r", kind:"spell", en:"R — Depth Charge", fr:"R — Grenade ASM"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"dredgeLine", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"titanSWrath", v:A.wDmg, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"riptide", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"depthCharge", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage per Instance : ligne non modelisee (30/2 to 70/2 (+ 40/2% AP))
   - E / Reduced Damage : ligne non modelisee (55*0.5 to 195*0.5 (+ 50*0.5% AP))
   - E / Monster Bonus Damage : ligne non modelisee (125 to 285 (+ 50% AP))
   - R / Knock Up Duration : ligne non modelisee (1 to 2 seconds)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
