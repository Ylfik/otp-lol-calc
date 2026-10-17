/* Leona — généré depuis les données du wiki, passif écrit à la main.

   Sunlight : les sorts de Leona marquent leurs cibles ; c'est un allié
   qui consomme la marque, pas elle.

     « Allied champions damaging attacks and abilities against a marked
       target will consume the mark to deal 32 to 151 (par niveau) bonus
       magic damage » — data/champions/Leona, passif Sunlight

   Les dégâts reviennent à l'allié qui déclenche la marque : ils sont
   affichés, mais n'entrent pas dans une séquence de Leona.

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"leona", name:"Leona", label:"Leona", splash:0,
    base:{hp:[646,101], mana:[302,40], ad:[60,3],
          ar:[43,4.8], mr:[32,2.05],
          as:0.625, asPerLevel:2.9, ms:335},
    abilities_meta:[
      {k:"q", en:"Shield of Daybreak", fr:"Bouclier de l'aube"},
      {k:"w", en:"Eclipse", fr:"Éclipse"},
      {k:"e", en:"Zenith Blade", fr:"Lame du zénith"},
      {k:"r", en:"Solar Flare", fr:"Éruption solaire"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[10,35,60,85,110], qAP:0.3, qCd:[5,5,5,5,5],
      wFlat:[55,85,115,145,175], wAP:0.4, wCd:[14,13,12,11,10],
      eFlat:[50,90,130,170,210], eAP:0.4, eCd:[12,10.5,9,7.5,6],
      rFlat:[150,225,300], rAP:0.8, rCd:[90,75,60],
      /* passif : linéaire du niveau 1 au 18 */
      pFlat:[32,151]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Shield of Daybreak */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Eclipse */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Zenith Blade */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Solar Flare */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      /* Sunlight — la marque, consommée par un allié */
      A.pDmg = lerp(T.pFlat[0], T.pFlat[1], L);
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Sunlight","Rayon de soleil"],
    l10n:{
      leonaSun:["Sunlight, consumed by an ally","Lumière du soleil, consommée par un allié"]
    },
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("leonaSun"), val:n0(A.pDmg)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Shield of Daybreak", fr:"Q — Bouclier de l'aube"},
      {id:"w", kind:"spell", en:"W — Eclipse", fr:"W — Éclipse"},
      {id:"e", kind:"spell", en:"E — Zenith Blade", fr:"E — Lame du zénith"},
      {id:"r", kind:"spell", en:"R — Solar Flare", fr:"R — Éruption solaire"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"shieldOfDaybreak", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"eclipse", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"zenithBlade", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"solarFlare", v:A.rDmg, type:"magic"});
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
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
