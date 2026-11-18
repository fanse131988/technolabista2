# TechnoLAB-ISTA — site officiel + console d'administration

Site vitrine complet (11 pages, bilingue FR/EN, responsive) et **console d'administration multi-utilisateurs** pour l'Institut Supérieur de Technologies Appliquées — Bamako, Mali.

## Contenu du dépôt

```
index.html                  Le site entier (7,3 Mo) : pages, images intégrées, pop-up, vidéos,
                            icônes de menu ET la console d'administration — un seul fichier.
admin-server/
  server.js                 API du contenu partagé : comptes, rôles, journal, sauvegardes.
  package.json
  data/                     Créé au premier démarrage (comptes, contenu, journal, sauvegardes).
.github/workflows/deploy.yml Publication automatique sur GitHub Pages.
```

## 1. Mettre le site en ligne gratuitement (GitHub Pages)

1. Créer un dépôt **public** (Pages gratuit) — par exemple `technolab-ista`.
2. Envoyer ces fichiers (voir « Mise en ligne du dépôt » ci-dessous).
3. `Settings → Pages → Source : GitHub Actions` (le workflow fourni s'en occupe ensuite à chaque envoi).
4. Le site est publié sur `https://<compte>.github.io/<dépôt>/`.

> ℹ️ Sur GitHub Pages, la console (`…/#admin`) fonctionne en **mode local** : chaque administrateur enregistre ses modifications dans son navigateur et peut les **exporter en JSON** (onglet Maintenance) pour les transmettre. Pour un travail réellement partagé (contenu commun, comptes centralisés), utilisez le serveur ci-dessous.

## 2. Travail à plusieurs (contenu partagé et journalisé)

Hébergez `admin-server/` sur un service Node.js (Render, Railway, Fly.io, VPS, hébergement mutualisé Node…).

```bash
cd admin-server
npm start                                  # http://localhost:8080/#admin
# en production :
ADMIN_PASSWORD='UnMotDePasseSolide!' PORT=8080 npm start
```

Variables d'environnement :

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8080` | port d'écoute |
| `ADMIN_PASSWORD` | `TechnoLAB2026` | mot de passe du compte `admin` créé au premier démarrage |
| `DATA_DIR` | `./data` | comptes, contenu, journal, sauvegardes |
| `SITE_FILE` | `../index.html` | fichier du site servi par le serveur |
| `SESSION_HOURS` | `12` | durée d'une session |

Points importants :

- **HTTPS obligatoire** (mots de passe) : proxy Nginx/Caddy ou HTTPS fourni par la plateforme.
- **`DATA_DIR` doit être persistant** (disque/volume). Sur Render : *Disks* ; sur Railway : *Volumes*.
- Le serveur détecte automatiquement son API quand la page est servie par lui : aucune configuration dans la console.
- Exemple Nginx + pm2 et détails de sauvegarde : voir `admin-server/README.md`.

## 3. Utilisation de la console

1. Ouvrir `…/#admin` (ou le lien **Administration** en bas de page).
2. Connexion initiale : identifiant `admin`, mot de passe `TechnoLAB2026` → **à changer immédiatement** (Utilisateurs → Changer le mot de passe).
3. Onglet **Utilisateurs** : compte administrateur unique — nom affiché, changement de mot de passe, état de la session et journal d'activité (connexions, publications, sauvegardes).

Les **huit onglets** de la console :

| Onglet | Ce qu'on y fait |
|---|---|
| **Pages & rubriques** | Modifier **chaque page séparément** (Accueil, Présentation, L'Institut, Le campus, DUT & Licences, Masters & MBA, Actualités, International, Alumni, Galerie, Contact) : les **1 089 textes** se corrigent directement dans l'aperçu, les images se remplacent par fichier ou par lien, les rubriques se réordonnent, se masquent, s'ajoutent ou se rechargent. Bouton `</> HTML` pour la source complète d'une rubrique. |
| **Bannières & titres** | Bannière, sur-titre, titre et chapeau de chaque page. |
| **Accueil & pop-up** | Annonce à la une et pop-up d'information (points, visuel, vidéo). |
| **Vidéos** | Liste des vidéos : **il suffit de coller un lien YouTube ou Vimeo** (ou un simple identifiant) — l'identifiant, la vignette et le lecteur intégré sont générés automatiquement. Titre et étiquette modifiables, ajout et suppression. |
| **Agenda · Actus · Réseaux** | Événements, actualités, réseaux sociaux. |
| **Coordonnées & pied de page** | Adresse, téléphones, e-mail, horaires, WhatsApp, antennes. |
| **Utilisateurs** | Compte administrateur, mot de passe, activité, déconnexion. |
| **Maintenance** | Sauvegarde JSON, restauration, serveur en ligne, journal, réinitialisation. |

### Où sont enregistrées les modifications ?
- **Avec le serveur en ligne** : « Enregistrer & appliquer » publie le contenu (`/api/content`) **et** les rubriques (`/api/site`) ; tous les visiteurs voient la nouvelle version au chargement suivant. Deux administrateurs qui se connectent récupèrent la dernière version publiée.
- **Sans serveur** (fichier ouvert directement, GitHub Pages, Netlify) : les modifications restent dans le navigateur et sont reprises à chaque visite du même appareil.
- Les images d'origine du site ne sont **pas** recopiées dans la sauvegarde : seuls les textes modifiés et les images remplacées sont stockés (~1,3 Mo au lieu de 4,8 Mo), ce qui évite de saturer le stockage du navigateur.


### Publication sans serveur : le fichier `content.json`
Si le site est hébergé **sans serveur** (Netlify, GitHub Pages, hébergement mutualisé statique), la console ne peut pas écrire sur le site : elle affiche alors **« Enregistré sur cet appareil »**.
Pour publier pour **tous les visiteurs** :
1. Console → onglet **Maintenance** → bloc **« Publier pour tous les visiteurs »** → bouton **⭳ Publier pour tous (content.json)** : le fichier `content.json` est téléchargé avec vos modifications.
2. Sur GitHub : **Add file → Upload files**, déposez `content.json` **à côté de `index.html`**, puis **Commit changes**.
3. Netlify / GitHub Pages republient le site ; chaque visiteur charge `content.json` à l'ouverture (le site affiche alors vos textes, images, vidéos et rubriques).
> Le fichier fait ~1,3 Mo (textes + images remplacées uniquement) et ne contient aucune image d'origine en double.
> Bouton **⟳ Charger le contenu publié** : recharge ce fichier dans la console pour repartir de la dernière version en ligne.

### Dépannage — « ma modification ne s'applique pas »

**Ce qui a été corrigé (version du 18/11/2026)**

| Cause | Effet constaté | Correction |
|---|---|---|
| Numéro de version identique d'une publication à l'autre | un visiteur **déjà venu** ne chargeait jamais la nouvelle version | comparaison **version + `publishedAt`** : toute nouvelle publication est appliquée |
| Rubrique « À la une » ré-écrite par l'éditeur | les textes de l'onglet « Accueil & pop-up » disparaissaient de la page | `A.renderAnnonce()` rejoué après chaque rendu + synchronisation rubrique ↔ onglet |
| Contenu publié ancien/incomplet | la section « À la une » pouvait disparaître de la page d'accueil | `A.mergeSeedSections()` réinsère toute rubrique d'origine absente du contenu reçu |
| Message « Enregistré et publié » affiché trop tôt | on croyait publié un contenu seulement local | message exact : *publié sur le serveur* ou *sur cet appareil* + raison |
| Bouton « Annuler mes changements » | rechargeait un état vide (perte du contenu en ligne) | recharge maintenant le **contenu publié** |
| Publication `content.json` | version réinitialisée à 1 → fichier ignoré comme « déjà à jour » | version calculée au-dessus de tout ce qui existe |

**Marche à suivre pour vérifier une mise à jour**

1. Console → **Enregistrer & appliquer**. Le message doit dire :
   - « **Enregistré et publié sur le serveur — visible par tous les visiteurs** » (site servi par `admin-server/`) ;
   - « **Enregistré sur cet appareil…** » (aucun serveur) → il faut alors publier le fichier `content.json`.
2. Sans serveur : onglet **Maintenance** → **⭳ Publier pour tous (content.json)** → déposer le fichier **à côté de `index.html`** (GitHub : *Add file → Upload files → Commit*). Le bloc affiche l'état : « Version publiée : v7 · date · serveur : aucun (fichier content.json) ».
3. Tester sur un **autre appareil** (ou navigation privée) : la page doit afficher la nouvelle version dès l'ouverture, sans vider le cache.
4. Si une ancienne version persiste : Maintenance → **⟳ Charger le contenu publié** (force la récupération), ou Ctrl + F5.

> Après un déploiement Render/Railway, vérifier `/api/health` : `{"ok":true,…}`. Le serveur sert le site **compressé** (5,2 Mo au lieu de 7,4 Mo) pour économiser la bande passante.

## Mise en ligne du dépôt

### Option A — sans ligne de commande (le plus simple)
1. Sur GitHub : `Add file → Upload files`.
2. Glisser `index.html`, `.gitignore` et le dossier `admin-server/` (sans le sous-dossier `data/`).
3. `Commit changes`.

### Option B — en ligne de commande

```bash
git init
git add index.html admin-server .github .gitignore
git commit -m "TechnoLAB-ISTA : site + console d'administration"
git branch -M main
git remote add origin https://github.com/<compte>/<dépôt>.git
git push -u origin main
```

> Le fichier `index.html` fait 7,3 Mo : **en dessous de la limite GitHub de 100 Mo par fichier**, aucun Git LFS nécessaire.
> `admin-server/data/` est ignoré par `.gitignore` (comptes et contenu réel, jamais dans le dépôt).

## Sécurité

- Mots de passe hachés (PBKDF2 côté navigateur, scrypt côté serveur) + sel aléatoire.
- Sessions à durée limitée, limitation des tentatives de connexion (8 essais / 10 min / IP).
- Ne jamais publier le dossier `data/` ni de sauvegarde JSON contenant des comptes.

---

## 🔐 Un seul administrateur

La console n'a **qu'un compte** : identifiant `admin`.
- Mot de passe initial sur Netlify/GitHub Pages : `TechnoLAB2026`
- Mot de passe initial sur le serveur en ligne : la valeur de la variable `ADMIN_PASSWORD`
- Il se change dans **Utilisateurs → Changer le mot de passe**. Si le site est servi par le serveur en ligne, le changement est appliqué **aussi sur le serveur**.

La gestion de plusieurs comptes a été retirée : il n'y a plus d'onglet « Comptes », plus de profils, plus d'invitations.

## 🌐 Mettre le serveur en ligne sur Render ou Railway

Le serveur `admin-server/` est **prêt à déployer** : zéro dépendance (`http`, `fs`, `crypto`, `zlib` natifs), Node.js 18+ suffit, `PORT` et l'hôte `0.0.0.0` sont déjà lus depuis l'environnement. Il sert **le site** (dossier racine) **et l'API** (`/api/…`) sur la même origine : la console détecte le serveur toute seule, aucune URL à saisir.

> **Règle d'or : le disque persistant est obligatoire.** Sans lui (plan gratuit Render, service Railway sans volume), comptes, contenu publié, journal et sauvegardes disparaissent à chaque redéploiement, redémarrage ou mise en veille. Le serveur n'écrit **que** dans `DATA_DIR`.

---

### A. Render — procédure complète (~10 min)

**Prérequis** : un dépôt GitHub contenant ce dossier, un compte Render, et le plan **Starter (7 $/mois)** — c'est le seul plan qui autorise un disque persistant (le plan gratuit ne le permet pas et met le service en veille après 15 min).

1. **Envoyer le dépôt sur GitHub** (voir « Mise en ligne du dépôt »). Le fichier `render.yaml` est déjà à la racine.
2. Render → **New → Blueprint** → connecter GitHub → choisir le dépôt → **Connect**.
   Render lit `render.yaml` et affiche le service `technolab-ista-admin` (runtime Node, dossier `admin-server`, disque `/data`).
3. Renseigner la variable demandée :
   - `ADMIN_PASSWORD` = mot de passe initial du compte `admin` (8 caractères minimum, à changer ensuite dans la console).
4. **Apply / Create** → Render installe, lance `npm start`, puis teste `/api/health`. Le statut passe à **Live**.
5. Ouvrir **`https://technolab-ista-admin.onrender.com/#admin`** (l'adresse exacte est affichée en haut du service) → identifiant `admin` + le mot de passe de l'étape 3.
6. Vérifications : `/api/health` doit répondre
   `{"ok":true,"version":1,"users":1,"contentUpdatedAt":null,"backups":0}`.

**Si vous préférez créer le service à la main** (sans Blueprint) : *New → Web Service* → dépôt →
`Root Directory` = `admin-server` · `Build Command` = `npm install` · `Start Command` = `npm start` ·
`Health Check Path` = `/api/health` · **Environment** : `NODE_VERSION=20`, `DATA_DIR=/data`, `ADMIN_PASSWORD=…` ·
**Disks** : *Add Disk* → Name `technolab-data`, Mount Path `/data`, 1 GB · puis *Manual Deploy → Deploy latest commit*.

⚠️ `DATA_DIR` **doit** être égal au *Mount Path* du disque. Si vous changez l'un, changez l'autre.

**Changer de région plus tard** n'est pas possible sans recréer le service et le disque : choisir d'emblée une région proche (Frankfurt pour le Mali).

**Sur le plan gratuit Render** (sans disque) : le serveur fonctionne pour **tester**, mais chaque redémarrage remet `ADMIN_PASSWORD` comme mot de passe et efface le contenu. Dans ce cas, préférez la publication sans serveur (`content.json`, voir plus haut) ou Railway.

---

### B. Railway — procédure complète (~10 min)

Railway construit l'image avec le `Dockerfile` fourni (Node 20 Alpine, `DATA_DIR=/data`, `HEALTHCHECK` sur `/api/health`).

1. **Envoyer le dépôt sur GitHub** (le `Dockerfile` et `railway.json` sont à la racine).
2. Railway → **New Project → Deploy from GitHub repo** → choisir le dépôt.
   Railway repère `railway.json` : constructeur Dockerfile, `startCommand` = `node server.js`, healthcheck `/api/health`.
3. Onglet **Variables** du service :
   ```
   ADMIN_PASSWORD = votre mot de passe (8 caractères minimum)
   DATA_DIR       = /data
   ```
   (`PORT` est fourni par Railway ; l'image écoute sur `0.0.0.0`.)
4. Onglet **Volumes** → **Add Volume** → point de montage **`/data`** (taille 1 GB suffit). Sans ce volume, tout est perdu au redéploiement.
5. Onglet **Networking** → **Generate Domain** → vous obtenez `https://<service>.up.railway.app`.
6. Ouvrir **`https://<service>.up.railway.app/#admin`** → `admin` + le mot de passe de l'étape 3.

**Sans Docker** (alternative Railway « Node ») : *Settings → Build* → Builder = **Nixpacks**, **Root Directory** = `admin-server`, *Start Command* = `npm start`. Le site doit alors être fourni au serveur : soit `SITE_FILE=/app/index.html` avec le fichier présent, soit builder à la racine et lancer `node admin-server/server.js` — dans ce dernier cas le serveur trouve `../index.html` tout seul.
Le coût Railway est **à l'usage** (Hobby 5 $/mois incluant 5 $ de ressources ; volume ≈ 0,15 $/GB/mois ; sortie ≈ 0,05 $/GB).

---

### C. Après le déploiement — brancher le site public sur l'API

Deux situations :

1. **Le site est servi par ce serveur** (`https://…onrender.com/` ou `https://…up.railway.app/`) : rien à faire. `IstaAdmin.detectApi()` interroge `/api/health` sur la même origine, trouve le serveur, et le message affiché devient **« Enregistré et publié sur le serveur »**.
2. **Le site reste sur Netlify / GitHub Pages** et seul le serveur est sur Render/Railway : dans la console, onglet **Maintenance → Adresse de l'API**, coller l'adresse du service (`https://technolab-ista-admin.onrender.com`, sans `/` final) → **Enregistrer l'adresse**, puis se reconnecter. L'API accepte les appels depuis une autre origine (`Access-Control-Allow-Origin: *`), et le contenu publié est lu par tous les visiteurs du site (`/api/content`).

> Pour un domaine personnalisé (`admin.technolab-ista.ml`), utilisez *Settings → Custom Domain* chez Render/Railway, puis mettez cette adresse dans le champ « Adresse de l'API ».

### D. Volume, bande passante et coûts — ce qui compte vraiment

| Point | Chiffre mesuré | Conséquence |
|---|---|---|
| `index.html` | 7 412 070 o (7,4 Mo) | servi **compressé (gzip) : ≈ 5,2 Mo** par le serveur (mis en cache, ETag + 304) |
| Contenu publié (`data/content.json`) | ≈ 1,3 Mo | écrit à chaque enregistrement + une copie dans `data/backups/` (60 conservées) |
| Disque | 1 GB suffit très largement | plans : Render Starter 7 $/mois ; Railway à l'usage (~5 $/mois + volume) |
| Bande passante incluse | 5 GB/mois | ≈ **900 visites** de la page d'accueil (7,4 Mo → 5,2 Mo compressé) ou ≈ 4 000 chargements de contenu |
| RAM | ≈ 62 Mo mesurés | compatible avec 512 Mo (Render Starter, Railway Hobby) |

Si la bande passante devient un souci, deux options simples : (1) garder le site **statique sur Netlify** (bande passante 100 Go/mois) et n'utiliser Render/Railway **que** pour l'API — c'est la combinaison la moins coûteuse ; (2) servir les images depuis un espace statique externe.

### E. Sauvegardes et restauration du serveur

- À chaque publication, le serveur écrit `data/content.json` puis une copie horodatée dans `data/backups/content-<date>.json` (60 dernières conservées).
- **Render** : *Dashboard → service → Disks* indique l'état du disque ; un *Manual Deploy* ne l'efface pas. Pour archiver, télécharger `data/content.json` par SSH/shell (plan Starter) ou via la console → *Maintenance → Exporter la sauvegarde*.
- **Railway** : volume `technolab-data`, consultable en SSH depuis le service (`railway ssh`, puis `ls /data`).
- Pour repartir d'une sauvegarde : *Maintenance → Restaurer un fichier* dans la console, puis « Enregistrer & appliquer ».

### F. Serveur sur un VPS (si vous préférez maîtriser)

```bash
git clone <votre-dépôt> && cd <dépôt>
docker build -t technolab-admin .
docker run -d --name technolab-admin -p 8080:8080 \
  -e ADMIN_PASSWORD='UnMotDePasseSolide!' \
  -v technolab-data:/data --restart unless-stopped technolab-admin
# HTTPS : Nginx/Caddy en frontal (obligatoire pour les mots de passe)
```

## 🧪 Vérifications après déploiement

| Contrôle | Adresse | Attendu |
|---|---|---|
| État du serveur | `https://<domaine>/api/health` | `{"ok":true,…,"users":1,…}` |
| Console | `https://<domaine>/#admin` | écran de connexion |
| Site public | `https://<domaine>/` | page d'accueil avec le pop-up |
| Persistance | redéployer puis `/api/health` | `contentUpdatedAt` inchangé |
| Rubriques publiées | `https://<domaine>/api/site` | `{"data":{"version":1,…}}` après un enregistrement |
| Édition d’une page | console → **Pages & rubriques** → modifier un texte → enregistrer | texte visible sur le site public après rechargement |
| Vidéo par lien | console → **Vidéos** → coller `https://youtu.be/…` → enregistrer | vignette et lecteur affichés sur l’accueil |

> Le serveur en ligne sert **le même fichier `index.html`** : il n'y a rien d'autre à publier à part le dossier `admin-server/`.
