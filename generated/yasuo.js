/* yasuo — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Yasuo.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"yasuo", name:"Yasuo", label:"Yasuo", splash:0,
    base:{hp:[590,110], mana:[100,0], ad:[60,2.5],
          ar:[32,4.6], mr:[32,2.05],
          as:0.697, asPerLevel:3.5, ms:345},
    abilities_meta:[
      {k:"q", en:"Steel Tempest", fr:"Tempête d'acier"},
      {k:"w", en:"Wind Wall", fr:"Mur de vent"},
      {k:"e", en:"Sweeping Blade", fr:"Cercle tranchant"},
      {k:"r", en:"Last Breath", fr:"Dernier soupir"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[20,45,70,95,120], qAD:1.05,
      wCd:[25,23,21,19,17],
      eFlat:[70,85,100,115,130], eBonusAD:0.2, eAP:0.6, ePerStack:[17.5,21.25,25,28.75,32.5], ePerStackBonusAD:0.05, ePerStackAP:0.15, eMax:[70,85,100,115,130], eMaxBonusAD:0.2, eMaxAP:0.6, eTotal:[140,170,200,230,260], eTotalBonusAD:0.4, eTotalAP:1.2, eCd:[0.5,0.4,0.3,0.2,0.1],
      rFlat:[200,350,500], rBonusAD:1.5, rCd:[70,50,30]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Steel Tempest */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* E — Sweeping Blade */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      A.ePerStack = R(T.ePerStack,er) + T.ePerStackBonusAD*bonusAD + T.ePerStackAP*ap;
      A.eMax = R(T.eMax,er) + T.eMaxBonusAD*bonusAD + T.eMaxAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD + T.eTotalAP*ap;
      /* R — Last Breath */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.e){ A.eDmg=0; A.ePerStack=0; A.eMax=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Way of the Wanderer","Voie du vagabond"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Steel Tempest", fr:"Q — Tempête d'acier"},
      {id:"e", kind:"spell", en:"E — Sweeping Blade", fr:"E — Cercle tranchant"},
      {id:"r", kind:"spell", en:"R — Last Breath", fr:"R — Dernier soupir"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"steelTempest", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"sweepingBlade", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"lastBreath", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.ePerStack)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Critical Strike Damage : ligne non modelisee (20 to 120 {{as|(+ {{as|{{critical damage|*1.05|105|mod=}}|critical damage}} AD)|ad}})
   - Q : aucune recharge dans les donnees wiki
   - W / Wall Width : ligne non modelisee (320 to 600)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Flow) : non modelisee
   ------------------------------------------------------------------ */
