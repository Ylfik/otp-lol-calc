# lol-overlay

Overlay in-game pour League of Legends. Première brique : le **minuteur
d'objectifs**, qui prévient quelques secondes avant que le Baron, un drake,
le héraut ou les larves ne réapparaissent.

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

`release/` contient alors un `LoL Overlay-0.1.0-win.exe` : c'est lui qu'on
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

Au lancement, l'app regarde une fois les Releases du dépôt et, si une
version plus récente existe, le dit — dans l'overlay et dans les réglages,
avec un bouton qui ouvre la page de téléchargement.

**Elle ne se remplace jamais toute seule.** L'installeur n'est pas signé :
une mise à jour silencieuse serait à la fois plus difficile à faire
confiance et plus facile à casser. Un avertissement et un lien suffisent,
et ne peuvent abîmer aucune installation.

Si GitHub est lent, injoignable ou limite les requêtes, l'app se tait : un
problème de réseau ne doit jamais déranger une partie. Avec
`OVERLAY_DEBUG=1`, la raison s'affiche dans la console.

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
git tag overlay-v0.1.0 && git push origin overlay-v0.1.0
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
npm test        # la logique du minuteur, sans Electron ni League
npm run demo    # le lecteur réel contre une fausse partie, dans le terminal
npm start       # l'overlay, sans passer par l'installeur
```

**League doit tourner en mode sans bordure.** Aucune fenêtre ne peut
s'afficher par-dessus un plein écran exclusif : c'est une limite du mode
d'affichage, pas de l'app. Tous les overlays du marché ont la même
contrainte.

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
src/main/store.ts          les réglages sur disque
src/main/index.ts          overlay, fenêtre de réglages, barre système
src/renderer/              ce qui s'affiche
tools/mock-game.ts         fausse partie, pour tester sans League
test/                      36 cas : minuteur, réglages, builds
```

Le calcul ne dépend ni d'Electron ni du réseau : c'est une fonction de
l'horloge et des événements déjà survenus. C'est ce qui permet de le tester
sans lancer le jeu, et c'est là que vit toute la logique délicate (l'Ancien
qui remplace le drake au quatrième d'une **même** équipe, les camps qui ne
reviennent jamais, une alerte annoncée une seule fois par apparition).

## Ce qui a été vérifié, et ce qui ne l'est pas

Vérifié : les 36 tests, la construction du paquet, et l'application
complète lancée sous écran virtuel contre la fausse partie — fenêtre
affichée, alertes déclenchées au bon moment, décomptes justes, objectifs
qui disparaissent une fois tués.

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
