/* seraphine — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Seraphine.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"seraphine", name:"Seraphine", label:"Seraphine", splash:0,
    base:{hp:[570,95], mana:[360,40], ad:[50,3],
          ar:[26,4.2], mr:[30,1.3],
          as:0.669, asPerLevel:2, ms:330},
    abilities_meta:[
      {k:"q", en:"High Note", fr:"Note aiguë"},
      {k:"w", en:"Surround Sound", fr:"Son ambiophonique"},
      {k:"e", en:"Beat Drop", fr:"Battement"},
      {k:"r", en:"Encore", fr:"Bis"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,85,110,135,160], qAP:0.4, qMax:[105,148.75,192.5,236.25,280], qMaxAP:0.7, qCd:[8,7.5,7,6.5,6],
      wShield:[60,80,100,120,140], wShieldAP:0.2, wHealMissPct:[8,10,12,14,16], wCd:[22,22,22,22,22],
      eFlat:[70,100,130,160,190], eAP:0.5, eCc:[1.1,1.2,1.3,1.4,1.5], eCd:[11,11,11,11,11],
      rFlat:[150,200,250], rAP:0.4, rCc:[1.25,1.5,1.75], rCd:[160,140,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — High Note */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      /* W — Surround Sound */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap;
      A.wHealMissPct = R(T.wHealMissPct,wr);   /* % des PV de la cible, applique dans onStep */
      /* E — Beat Drop */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eCc = R(T.eCc,er);
      /* R — Encore */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wShield=0; A.wHealMissPct=0; }
      if(!learned.e){ A.eDmg=0; A.eCc=0; }
      if(!learned.r){ A.rDmg=0; A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Stage Presence","Présence sur scène"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — High Note", fr:"Q — Note aiguë"},
      {id:"w", kind:"cast", label:"W", en:"W — Surround Sound", fr:"W — Son ambiophonique"},
      {id:"e", kind:"spell", en:"E — Beat Drop", fr:"E — Battement"},
      {id:"r", kind:"spell", en:"R — Encore", fr:"R — Bis"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"highNote", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"surroundSound", v:Math.max(0, hp - cur) * A.wHealMissPct/100, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"beatDrop", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"encore", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("mPpct"), val:pc(A.wHealMissPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E / Minion Damage : ligne non modelisee (70*0.7 to 190*0.7 (+ 50*0.7% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
