# lol-overlay

Overlay in-game pour League of Legends. Trois choses :

- une **fenêtre principale**, qui s'ouvre au lancement et dit d'un coup
  d'œil si l'app voit le client et la partie ;
- pendant la **sélection des champions**, le choix d'un build du site et
  son envoi dans le client — runes et objets, en un bouton ;
- en jeu, le **minuteur d'objectifs**, qui prévient quelques secondes avant
  que le Baron, un drake, le héraut ou les larves ne réapparaissent.

## Pourquoi ça ne demande ni clé API ni autorisation Riot

Pendant une partie, le jeu sert lui-même ses données sur `127.0.0.1:2999`
(la *Live Client Data API*) : horloge, joueurs, objets portés, événements.
C'est local, illimité, et rien ne sort de la machine. Le minuteur n'a besoin
de rien d'autre : les délais de réapparition sont des constantes connues, et
les morts d'objectifs arrivent dans le flux d'événements.

La clé API de Riot ne devient nécessaire que pour consulter l'historique
d'**autres** joueurs — le scouting. Ce n'est pas dans cette brique.

## Installer

Il faut **Node.js** (version 20 ou plus) installé.

```bash
npm install
npm run dist     # fabrique l'installeur Windows dans release/
```

`release/` contient alors un `LoL Overlay-0.2.0-win.exe` : c'est lui qu'on
installe. L'installeur laisse choisir le dossier et pose un raccourci sur
le bureau.

> À lancer **sur une machine Windows**. La configuration de paquet a été
> validée par une construction complète en format Linux, mais produire un
> `.exe` demande Windows — ou GitHub, voir ci-dessous.

### Windows va afficher un avertissement

Au premier lancement de l'installeur, Windows dira « Windows a protégé
votre ordinateur ». C'est normal : le fichier n'est pas signé par un
certificat d'éditeur, qui se paie à l'année. Il faut cliquer sur
**Informations complémentaires** puis **Exécuter quand même**.

Prévenez-en les personnes à qui vous donnez l'app, sinon beaucoup
s'arrêteront là en croyant à un virus.

## Les mises à jour

Au lancement, l'app regarde une fois les Releases du dépôt. S'il en existe
une plus récente, **elle la télécharge toute seule, en arrière-plan** et le
dit dans la fenêtre principale, avec une barre d'avancement. Puis elle
attend.

**Elle ne s'installe jamais pendant que vous jouez.** Le remplacement n'a
lieu que de deux façons :

- vous cliquez sur **Installer et redémarrer** ;
- ou vous quittez l'app vous-même, et l'installeur s'exécute à ce
  moment-là, silencieusement.

C'est le seul compromis raisonnable : une app qui se relance d'autorité au
milieu d'un Baron est pire que pas de mise à jour du tout.

Elle se réinstalle dans le dossier choisi à la première installation —
l'installeur silencieux le relit dans le registre. Si ce dossier demande
des droits administrateur, Windows affichera une demande d'élévation.

### Quand elle ne peut pas

Trois cas, et dans les trois l'app propose simplement le lien plutôt que
d'échouer :

- une Release publiée **à la main**, sans les fichiers `latest.yml` et
  `.blockmap` que l'app lit pour se remplacer ;
- l'app lancée depuis les sources plutôt qu'installée ;
- GitHub injoignable ou lent — là, elle se tait complètement.

Un problème de réseau ne doit jamais déranger une partie. Avec
`OVERLAY_DEBUG=1`, la raison s'affiche dans la console.

### Ce que ça garantit, et ce que ça ne garantit pas

Le fichier téléchargé est vérifié contre l'empreinte `sha512` publiée dans
`latest.yml`, servi par GitHub en HTTPS. Cela attrape un téléchargement
abîmé ou tronqué.

Cela **ne remplace pas une signature** : l'installeur n'est pas signé par
un certificat d'éditeur, donc electron-updater n'a rien à comparer et saute
cette vérification. La confiance repose sur le compte GitHub du dépôt.
Signer coûte quelques centaines d'euros par an ; tant que ce n'est pas
fait, c'est la situation, et elle est la même que pour la plupart des
petits outils de ce genre.

### Une réserve, pour plus tard

L'app lit **la dernière Release du dépôt**, quelle que soit son étiquette —
le dépôt est partagé avec le site. Tant que seules les versions de
l'overlay y sont publiées, tout va bien. Le jour où le site publierait une
Release de son côté, l'app la prendrait pour la sienne et retomberait sur
le lien. Le préfixe `overlay-v` sert à les distinguer côté construction, pas
côté lecture.

## Donner l'app à quelqu'un

Le `.exe` fait environ 120 Mo : trop gros pour Discord sans Nitro. Le plus
simple est une **Release GitHub**, qui donne un lien de téléchargement
permanent.

**Sans rien installer** : sur le dépôt GitHub (`Ylfik/otp-lol-calc`), onglet *Releases*
→ *Draft a new release* → glissez le `.exe` → *Publish*. Le lien se donne
à n'importe qui.

**Automatiquement** : `.github/workflows/release.yml` est déjà là. Une fois
le code poussé sur GitHub, poser une étiquette suffit —

```bash
git tag overlay-v0.2.0 && git push origin overlay-v0.2.0
```

Le préfixe `overlay-` compte : le dépôt est partagé avec le site, et seules
les étiquettes qui le portent déclenchent une construction — et sont vues
comme des mises à jour par l'app.

— et GitHub emprunte une machine Windows, lance les tests, construit
l'installeur et crée la Release tout seul. Il y a aussi un bouton *Run
workflow* dans l'onglet *Actions* pour un essai sans étiquette : le `.exe`
est alors déposé en pièce jointe du job.

## Développer

```bash
npm test            # la logique pure, sans Electron ni League
npm run demo        # le lecteur réel contre une fausse partie, au terminal
npm run demo:draft  # l'app entière contre un faux client, draft et import compris
npm run demo:update # la mise à jour automatique contre un faux dépôt
npm start           # l'overlay, sans passer par l'installeur
```

**League doit tourner en mode sans bordure.** Aucune fenêtre ne peut
s'afficher par-dessus un plein écran exclusif : c'est une limite du mode
d'affichage, pas de l'app. Tous les overlays du marché ont la même
contrainte.

### Voir la draft sans lancer le client

`npm run demo:draft` lance le faux site, le faux client League et l'app
sous écran virtuel, attend que la draft s'ouvre, choisit un build, presse
**Importer** — puis relit ce que le faux client a reçu : les neuf runes
dans l'ordre que le vrai client attend, les deux arbres, les numéros
d'objets, et le fait que la page faite à la main a survécu. Un bouton qui
devient vert ne prouve rien ; ce qui est arrivé au client, si.

Pour le piloter à la main :

```bash
npm run mock:client                                           # un terminal
OVERLAY_LOCKFILE=/tmp/lol-mock-lockfile \
  OVERLAY_DDRAGON=http://127.0.0.1:2997 npm start             # un autre
```

### Éprouver la mise à jour sans rien publier

`npm run demo:update` sert un faux dépôt annonçant une version 9.9.9,
lance l'app, et la regarde passer par « disponible », « téléchargement »
et « prête » — puis vérifie que le fichier arrivé dans le cache est bien
celui qui était annoncé, taille et empreinte comprises, et que **rien ne
s'est installé tout seul**. C'est le vrai electron-updater qui travaille ;
seul GitHub est remplacé.

```bash
DEMO_MODE=manual npm run demo:update    # la Release sans métadonnées
```

Ce second scénario vérifie l'autre moitié : une Release publiée à la main
doit donner un lien, pas un message d'erreur.

### Voir l'overlay sans lancer une partie

```bash
npm run mock                                     # dans un terminal
OVERLAY_PORT=2998 OVERLAY_SCHEME=http npm start  # dans un autre
```

La fausse partie rejoue un scénario complet (quatre drakes pour une équipe,
larves, héraut, baron, Ancien) avec l'horloge accélérée, pour voir passer
toutes les alertes en deux minutes.

## Réglages

Clic droit sur l'icône dans la barre système → **Réglages**.

- **Alerte générale** : de 5 à 120 secondes d'avance. S'applique à tout
  objectif qui n'a pas son propre délai.
- **Par objectif** : chacun peut être coupé, ou recevoir un délai qui
  remplace le général. Videz le champ pour revenir au réglage commun —
  le Baron mérite souvent plus d'avance qu'un camp de larves.
- **Affichage** : décompte permanent ou alertes seules, et la langue.

L'app dessine **deux** choses à l'écran : un décompte discret dans le coin
haut droit, et les avertissements de réapparition dans une fenêtre à part,
centrée en haut. Un coin convient à ce qu'on peut lire ; le milieu à ce
qu'on ne doit pas manquer.

Tout est enregistré immédiatement, dans le dossier de profil de
l'application (jamais à côté du programme, pour qu'une mise à jour ne
l'efface pas). Le menu de la barre système sait l'ouvrir.

Restent en variables d'environnement, parce qu'elles ne servent qu'au
développement :

| Variable | Défaut | Rôle |
|---|---|---|
| `OVERLAY_PORT` | `2999` | port de l'API du jeu |
| `OVERLAY_SCHEME` | `https` | `http` pour la fausse partie |
| `OVERLAY_DEBUG` | — | `1` affiche chaque lecture et **les noms d'événements vus** |
| `OVERLAY_LOCKFILE` | — | chemin du `lockfile` du client, pour le faux client |
| `OVERLAY_DDRAGON` | ddragon.leagueoflegends.com | la base des données statiques de Riot |
| `OVERLAY_GITHUB` | api.github.com | l'API où chercher les Releases |
| `OVERLAY_UPDATE_DEV` | — | `1` : chercher une mise à jour même non installée |
| `OVERLAY_SITE` | le vrai Supabase | d'où viennent les builds |

## La fenêtre principale

Elle s'ouvre au démarrage, et le bouton **Réduire dans la barre** la range
sans quitter l'app (l'icône de la barre système la rouvre). Une app qu'on
ne voit pas est une app qu'on croit éteinte : c'est tout ce que cette
fenêtre corrige.

Le voyant en haut dit laquelle des trois situations on est dans :

| Voyant | Ce que ça veut dire |
|---|---|
| gris | ni client ni partie — l'app tourne, il n'y a rien à faire |
| orange | le client League est ouvert ; les alertes démarreront avec la partie |
| vert | une partie est en cours, l'overlay est dessus |

## Importer un build pendant la draft

Dès que la sélection des champions commence et qu'un champion est choisi
(même seulement survolé), la fenêtre liste les builds disponibles pour lui :
d'abord les vôtres si vous êtes connecté, puis ceux publiés sur le site.
On en choisit un, on clique **Importer**, et le client reçoit :

- **la page de runes**, nommée `OTP · <nom du build>` et sélectionnée ;
- **le set d'objets**, rattaché au champion, visible dans la boutique.

L'app ne supprime jamais une page que vous avez faite à la main : elle
efface seulement celle qu'elle avait posée la fois d'avant, reconnue à son
nom. Un build sans runes passe quand même ses objets, et inversement — ce
qui a été envoyé est écrit sous le bouton.

### Ce que ça demande

Rien de plus. Le client League écrit son port et un mot de passe à usage
unique dans un fichier `lockfile` à côté de son exécutable ; c'est la clé,
elle est locale, et elle change à chaque démarrage. Aucune clé API Riot,
rien qui sorte de la machine. Si l'installation n'est pas à l'emplacement
habituel, `OVERLAY_LOCKFILE` dit où chercher.

Les noms d'objets du site sont traduits en numéros avec la liste de Riot
elle-même (Data Dragon), récupérée une fois : pas de table à maintenir à
chaque patch. Un objet que Riot ne reconnaît pas est compté à part dans le
compte rendu plutôt que silencieusement oublié.

## Les builds d'otp-lol-calc

Pendant une partie, l'app affiche **quelle compétence monter maintenant**,
d'après l'ordre enregistré avec un build du site. C'est la question utile
en jeu ; le reste du build se lit sur le site.

**Sans aucun compte**, elle lit les builds *publiés* sur la page de
partage. C'est suffisant pour jouer, et c'est le mode par défaut : quelqu'un
à qui on donne l'app n'a rien à configurer.

**Avec une connexion Discord** (Réglages → Builds du site), elle ajoute vos
builds enregistrés, que vous seul pouvez lire, et les fait passer devant
ceux des autres. La connexion n'est jamais demandée au démarrage.

### Ce que la connexion demande côté Supabase

Le retour de Discord arrive sur une adresse locale. Elle doit figurer dans
**Authentication → URL Configuration → Redirect URLs** :

```
http://127.0.0.1:53123/auth
```

Sans cette ligne, Supabase refusera la redirection et la connexion
échouera — le reste de l'app continuera de fonctionner.

### Ce qui est stocké, et où

Le jeton de session est chiffré par le magasin de clés du système (DPAPI
sous Windows) avant d'être écrit. **Si la machine n'offre pas ce
chiffrement, le jeton n'est pas écrit du tout** : il faut se reconnecter à
chaque démarrage. Un jeton de rafraîchissement en clair sur le disque est
un mot de passe en clair, et se reconnecter coûte moins cher que ça.

Aucun mot de passe ne passe par l'app : la connexion se fait dans votre
propre navigateur.

## Les horaires

Relevés sur le wiki officiel, pas de mémoire. Chaque valeur cite sa source
dans `src/shared/objectives.ts`, qui est le seul endroit à modifier quand un
patch les change.

| Objectif | Première apparition | Réapparition | Fin |
|---|---|---|---|
| Drake | 5:00 | 5:00 après la mort | remplacé par l'Ancien |
| Larves du Néant | 8:00 | une seule fois | 14:45 |
| Héraut de la Faille | 15:00 | une seule fois | 19:45 |
| Baron Nashor | 20:00 | 6:00 après la mort | — |
| Dragon Ancestral | au 4e drake d'une équipe | 6:00 | — |

**Atakhan n'est pas inclus** : sa page wiki porte le marqueur « retiré », il
n'est plus dans le jeu.

## Structure

```
src/shared/objectives.ts   la table des horaires et le calcul — pur, testé
src/shared/settings.ts     ce que l'utilisateur choisit, et les garde-fous
src/main/liveClient.ts     lecture de l'API locale du jeu
src/shared/builds.ts       un build du site, et quoi monter ensuite
src/main/siteClient.ts     lecture des builds publies et de la bibliotheque
src/main/auth.ts           connexion Discord optionnelle (PKCE, boucle locale)
src/shared/runes.ts        un build -> une page de runes que le client accepte
src/main/lcu.ts            dialogue avec le client League (draft, runes, objets)
src/main/items.ts          les noms d'objets du site -> les numéros de Riot
src/shared/updateState.ts  où en est une mise à jour, et comment le dire
src/main/autoUpdate.ts     le téléchargement et le remplacement de l'app
src/main/updates.ts        le repli : regarder les Releases et donner un lien
src/main/store.ts          les réglages sur disque
src/main/index.ts          fenêtre principale, overlay, réglages, barre système
src/renderer/              ce qui s'affiche
tools/mock-game.ts         fausse partie, pour tester sans League
tools/mock-client.ts       faux client League : draft, runes, objets
tools/draft-demo.mjs       l'app entière contre les deux, et ce qu'elle a envoyé
tools/update-demo.mjs      un faux dépôt, et la mise à jour jusqu'au bout
test/                      83 cas : minuteur, réglages, builds, runes, client, maj
```

Le calcul ne dépend ni d'Electron ni du réseau : c'est une fonction de
l'horloge et des événements déjà survenus. C'est ce qui permet de le tester
sans lancer le jeu, et c'est là que vit toute la logique délicate (l'Ancien
qui remplace le drake au quatrième d'une **même** équipe, les camps qui ne
reviennent jamais, une alerte annoncée une seule fois par apparition).

## Ce qui a été vérifié, et ce qui ne l'est pas

Vérifié : les 83 tests, la construction du paquet, et l'application
complète lancée sous écran virtuel — contre la fausse partie (fenêtre
affichée, alertes au bon moment, décomptes justes, objectifs qui
disparaissent une fois tués) et contre le faux client (la draft apparaît,
le build se choisit, l'import part, et la page de runes reçue est la
bonne) et contre un faux dépôt (la mise à jour se télécharge seule,
arrive entière, et attend qu'on la demande).

**Le remplacement final n'a pas été joué** : il faudrait qu'une vraie
version s'installe par-dessus une vraie version, sous Windows. Tout ce qui
le précède l'a été. La première mise à jour réelle sera donc la 0.2.0 vers
la suivante — gardez l'installeur sous la main cette fois-là.

**L'import n'a pas encore vu un vrai client League.** Les endpoints et la
forme des pages de runes viennent de la documentation du LCU ; le faux
client les rejoue fidèlement, mais c'est une imitation. Si le client refuse
quelque chose, le message d'erreur apparaît sous le bouton — il vient du
client lui-même, avec son code HTTP.

**Pas encore vérifié : une vraie partie.** Les noms d'événements
(`DragonKill`, `BaronKill`, `HeraldKill`, `HordeKill`) viennent de la
documentation et n'ont jamais été confrontés au jeu. Si une alerte ne part
pas, lancez avec `OVERLAY_DEBUG=1` : la console affiche les noms réellement
reçus, et il suffit de les ajouter au tableau `killEvents` dans
`src/shared/objectives.ts`, qui en accepte plusieurs par objectif.

**La connexion Discord n'a pas pu être essayée ici** : elle demande un vrai
navigateur et un aller-retour avec Discord. Le module se charge et répond
(la fenêtre de réglages affiche bien son état), mais le premier vrai
aller-retour reste à faire. La lecture des builds publiés, elle, a été
vérifiée contre le vrai Supabase puis de bout en bout contre un faux site.

L'icône est celle du site otp-lol-calc, reprise telle quelle (`build/icon.svg`).
