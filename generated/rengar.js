/* rengar — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Rengar.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"rengar", name:"Rengar", label:"Rengar", splash:0,
    base:{hp:[590,104], mana:[4,0], ad:[68,3],
          ar:[34,4.2], mr:[32,2.05],
          as:0.667, asPerLevel:3, ms:345},
    abilities_meta:[
      {k:"q", en:"Savagery", fr:"Esprit sauvage"},
      {k:"w", en:"Battle Roar", fr:"Rugissement"},
      {k:"e", en:"Bola Strike", fr:"Bolas"},
      {k:"r", en:"Thrill of the Hunt", fr:"Chasseur-né"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[20,55,90,125,160], qAD:0.05, qCd:[6,5.5,5,4.5,4],
      wFlat:[50,80,110,140,170], wAP:0.8, wCd:[16,14.5,13,11.5,10],
      eFlat:[55,100,145,190,235], eBonusAD:0.8, eSlow:[30,45,60,75,90], eCd:[10,10,10,10,10],
      rCc:[12,16,20], rMs:[40,50,60], rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Savagery */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Battle Roar */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Bola Strike */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eSlow = R(T.eSlow,er);
      /* R — Thrill of the Hunt */
      A.rCc = R(T.rCc,rr);
      A.rMs = R(T.rMs,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rCc=0; A.rMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Unseen Predator","Prédateur invisible"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Savagery", fr:"Q — Esprit sauvage"},
      {id:"w", kind:"spell", en:"W — Battle Roar", fr:"W — Rugissement"},
      {id:"e", kind:"spell", en:"E — Bola Strike", fr:"E — Bolas"},
      {id:"r", kind:"cast", label:"R", en:"R — Thrill of the Hunt", fr:"R — Chasseur-né"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"savagery", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"battleRoar", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"bolaStrike", v:A.eDmg, type:"phys"});
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
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Armor Reduction : ligne non modelisee (15 to 25)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Ferocity) : non modelisee
   ------------------------------------------------------------------ */
