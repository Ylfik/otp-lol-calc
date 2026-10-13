/* yuumi — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Yuumi.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"yuumi", name:"Yuumi", label:"Yuumi", splash:0,
    base:{hp:[500,69], mana:[440,45], ad:[49,3.1],
          ar:[25,4.2], mr:[25,1.1],
          as:0.625, asPerLevel:1, ms:330},
    abilities_meta:[
      {k:"q", en:"Prowling Projectile", fr:"Tête chat-sseuse"},
      {k:"w", en:"You and Me!", fr:"Félin pour l'autre !"},
      {k:"e", en:"Zoomies", fr:"Zouuu !"},
      {k:"r", en:"Final Chapter", fr:"Chat-pitre final"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,95,130,165,200,235], qAP:0.2, qMax:[80,135,190,245,300,355], qMaxAP:0.3, qSlowMax:[50,53,56,59,62,65], qMin:[10,12,14,16,18,20], qMinAP:0.05, qOn:[17.5,21,24.5,28,31.5,35], qOnAP:0.0875, qCd:[6.5,6.5,6.5,6.5,6.5],
      wShield:[4,5,6,7,8], wHeal:[3,4,5,6,7], wHealAP:0.03,
      eShield:[65,90,115,140,165], eShieldAP:0.4, eAS:[25,27.5,30,32.5,35], eASAP100:8, eCd:[10,10,10,10,10],
      rHealTotal:[150,250,350], rHealTotalAP:0.6, rFlat:[150,250,350], rAP:0.5, rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Prowling Projectile */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      A.qSlowMax = R(T.qSlowMax,qr);
      A.qMin = R(T.qMin,qr) + T.qMinAP*ap;
      A.qOn = R(T.qOn,qr) + T.qOnAP*ap;
      /* W — You and Me! */
      A.wShield = R(T.wShield,wr);
      A.wHeal = R(T.wHeal,wr) + T.wHealAP*ap;
      /* E — Zoomies */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      A.eAS = R(T.eAS,er) + T.eASAP100*ap/100;
      /* R — Final Chapter */
      A.rHealTotal = R(T.rHealTotal,rr) + T.rHealTotalAP*ap;
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; A.qSlowMax=0; A.qMin=0; A.qOn=0; }
      if(!learned.w){ A.wShield=0; A.wHeal=0; }
      if(!learned.e){ A.eShield=0; A.eAS=0; }
      if(!learned.r){ A.rHealTotal=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Feline Friendship","Chat-maraderie"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Prowling Projectile", fr:"Q — Tête chat-sseuse"},
      {id:"w", kind:"cast", label:"W", en:"W — You and Me!", fr:"W — Félin pour l'autre !"},
      {id:"e", kind:"cast", label:"E", en:"E — Zoomies", fr:"E — Zouuu !"},
      {id:"r", kind:"spell", en:"R — Final Chapter", fr:"R — Chat-pitre final"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"prowlingProjectile", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.heal = A.wHeal;
        out.shield = A.wShield;
      }
      if(st.id === "e"){
        out.shield = A.eShield;
        out.asBonus = A.eAS;
      }
      if(st.id === "r"){
        out.parts.push({n:"finalChapter", v:A.rDmg, type:"magic"});
        out.heal = A.rHealTotal;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("slow"), val:pc(A.qSlowMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("healing"), val:n0(A.wHeal)}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHealTotal)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : aucune recharge dans les donnees wiki
   - E / Minimum Mana Restored : ligne non modelisee (20 to 36)
   - E / Maximum Mana Restored : ligne non modelisee (20*2 to 36*2)
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Heal per Hit : ligne non modelisee (30 to 70 (+ 12% AP))
   - R / Magic Damage per Hit : ligne non modelisee (75 to 175 (+ 25% AP))
   - R / Reduced Damage per Hit : ligne non modelisee (75*0.25 to 175*0.25 (+ 25*0.25% AP))
   - passif : 2 blocs dans le wiki (Feline Friendship, Bop 'n' Block) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - une table a six rangs : ce kit ne suit pas le schema 5/5/5/3, rankCap a revoir
   ------------------------------------------------------------------ */
