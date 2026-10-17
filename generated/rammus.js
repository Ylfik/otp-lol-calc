/* rammus — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Rammus.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"rammus", name:"Rammus", label:"Rammus", splash:0,
    base:{hp:[645,100], mana:[310,33], ad:[65,2.75],
          ar:[35,4.5], mr:[32,2.05],
          as:0.7, asPerLevel:2.215, ms:335},
    abilities_meta:[
      {k:"q", en:"Powerball", fr:"Démolisseur"},
      {k:"w", en:"Defensive Ball Curl", fr:"Boule défensive"},
      {k:"e", en:"Frenzying Taunt", fr:"Provocation frénétique"},
      {k:"r", en:"Soaring Slam", fr:"Frappe ascendante"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qAP:1, qSlow:[40,50,60,70,80], qCd:[12,10.5,9,7.5,6],
      wCd:[7,7,7,7,7],
      eCc:[1.2,1.4,1.6,1.8,2], eCd:[12,12,12,12,12],
      rFlat:[150,250,350], rAP:0.6, rSlow:[30,40,50], rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Powerball */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qSlow = R(T.qSlow,qr);
      /* E — Frenzying Taunt */
      A.eCc = R(T.eCc,er);
      /* R — Soaring Slam */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.e){ A.eCc=0; }
      if(!learned.r){ A.rDmg=0; A.rSlow=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Spiked Shell","Carapace cloutée"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Powerball", fr:"Q — Démolisseur"},
      {id:"e", kind:"cast", label:"E", en:"E — Frenzying Taunt", fr:"E — Provocation frénétique"},
      {id:"r", kind:"spell", en:"R — Soaring Slam", fr:"R — Frappe ascendante"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"powerball", v:A.qDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"soaringSlam", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : 2 formes dans le wiki (Frenzying Taunt, Puncturing Taunt) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Soaring Slam, Tremors) — seule la premiere est modelisee
   - W / Bonus Armor : ligne non modelisee (27 to 47 (+ 30 to 60% total armor))
   - W / Bonus Magic Resistance : ligne non modelisee (20 to 40 (+ 30 to 60% total magic resistance))
   - E / Monster Magic Damage : ligne non modelisee (80 to 160 (+ 70% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
