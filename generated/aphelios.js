/* aphelios — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Aphelios.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"aphelios", name:"Aphelios", label:"Aphelios", splash:0,
    base:{hp:[600,102], mana:[348,42], ad:[55,2.3],
          ar:[26,4.2], mr:[33,1.1],
          as:0.665, asPerLevel:2.1, ms:325},
    abilities_meta:[
      {k:"q", en:"Weapon Abilites", fr:"Compétences d'arme"},
      {k:"w", en:"Phase", fr:"Phase"},
      {k:"e", en:"Weapon Queue System", fr:"Système de file d'armes"},
      {k:"r", en:"Moonlight Vigil", fr:"Veille au clair de lune"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      pDmg:[4,8,12,16,20,24], pAS:[9,18,27,36,45,54]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* passif — The Hitman and the Seer */
      A.pDmg = R(T.pDmg,rr);
      A.pAS = R(T.pAS,rr);
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["The Hitman and the Seer","Le Tueur et l'Oracle"],
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [
        {lab:TR("damage"), val:n0(A.pDmg)}   /* Bonus Attack Damage */,
        {lab:TR("bonusAs"), val:pc(A.pAS)}   /* Bonus Attack Speed */
      ];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"aaP", kind:"attack", passif:true, en:"Auto, The Hitman and the Seer", fr:"Auto, Le Tueur et l'Oracle"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.kind === "attack" && st.passif)
        out.parts.push({n:"theHitmanAndTheSeer", v:A.pDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [],
        [],
        [],
        []
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « A » pour Calibrum
   - slot non reconnu « A » pour Crescendum
   - slot non reconnu « A » pour Gravitum
   - slot non reconnu « A » pour Infernum
   - slot non reconnu « A » pour Severum
   - Q : 6 formes dans le wiki (Weapons of the Faithful, Binding Eclipse, Duskwave, Moonshot, Onslaught, Sentry) — seule la premiere est modelisee
   - Q : aucune recharge dans les donnees wiki
   - W : aucune recharge dans les donnees wiki
   - E : aucune recharge dans les donnees wiki
   - R : recharge qui varie avec le niveau (120 a 100) non modelisee
   - passif / Bonus Attack Damage : progression par rang — le module la lit au rang du R, a verifier
   - passif / Bonus Attack Speed : progression par rang — le module la lit au rang du R, a verifier
   - passif / Lethality : ligne non modelisee (4.5 to 27 6)
   ------------------------------------------------------------------ */
