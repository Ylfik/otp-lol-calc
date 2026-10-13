/* zed — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Zed.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"zed", name:"Zed", label:"Zed", splash:0,
    base:{hp:[654,99], mana:[200,0], ad:[63,3.4],
          ar:[32,4.7], mr:[29,2.05],
          as:0.651, asPerLevel:3.3, ms:345},
    abilities_meta:[
      {k:"q", en:"Razor Shuriken", fr:"Shuriken-rasoir"},
      {k:"w", en:"Living Shadow", fr:"Ombre vivante"},
      {k:"e", en:"Shadow Slash", fr:"Taillade des ombres"},
      {k:"r", en:"Death Mark", fr:"Marque de la mort"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qBonusAD:1, qCd:[6,6,6,6,6],
      wCd:[20,19,18,17,16],
      eFlat:[70,92.5,115,137.5,160], eBonusAD:0.7, eSlow:[20,25,30,35,40], eSlowMax:[30,37.5,45,52.5,60], eCd:[5,4.5,4,3.5,3],
      rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Razor Shuriken */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* E — Shadow Slash */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eSlow = R(T.eSlow,er);
      A.eSlowMax = R(T.eSlowMax,er);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; A.eSlowMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Contempt for the Weak","Mépris des faibles"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Razor Shuriken", fr:"Q — Shuriken-rasoir"},
      {id:"e", kind:"spell", en:"E — Shadow Slash", fr:"E — Taillade des ombres"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"razorShuriken", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"shadowSlash", v:A.eDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("slow"), val:pc(A.eSlowMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Reduced Damage : ligne non modelisee (80*0.6 to 240*0.6 (+ 100*0.6% bonus AD))
   - W / Energy Restored : ligne non modelisee (30 to 50)
   - R / Physical Damage : ratio sans statistique « 25% of damage stored » non modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Energy) : non modelisee
   ------------------------------------------------------------------ */
