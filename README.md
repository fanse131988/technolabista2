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

## 🌐 Mettre le serveur en ligne (contenu partagé, sauvegardes, journal)

Trois chemins possibles, tous avec **HTTPS** et **volume persistant obligatoire** (sinon comptes et contenu sont perdus à chaque redéploiement).

### A. Render — le plus simple (fichier `render.yaml` fourni)
1. Pousser ce dépôt sur GitHub.
2. Render → **New → Blueprint** → choisir le dépôt : Render lit `render.yaml`.
3. Saisir `ADMIN_PASSWORD` quand il le demande → *Deploy*.
4. Ouvrir `https://<service>.onrender.com/#admin` → identifiant `admin`.
   - Nécessite le plan **Starter** (~7 $/mois) : c'est le seul moyen d'avoir un disque persistant sur Render.

### B. Railway — le moins cher (fichier `railway.json` + `Dockerfile` fournis)
1. Railway → **New project → Deploy from GitHub repo**.
2. Variables : `ADMIN_PASSWORD=…` et `DATA_DIR=/data`.
3. *Settings → Volumes* → ajouter un volume monté sur **`/data`**.
4. *Settings → Networking → Generate domain* → ouvrir `https://…up.railway.app/#admin`.

### C. VPS, Fly.io, Cloud Run — via Docker (fichier `Dockerfile` fourni)
```bash
docker build -t technolab-admin .
docker run -d --name technolab-admin -p 8080:8080 \
  -e ADMIN_PASSWORD='UnMotDePasseSolide!' \
  -v technolab-data:/data technolab-admin
# derrière Nginx + Certbot pour le HTTPS, ou le domaine fourni par Fly.io / Cloud Run
```

### D. Sans serveur (Netlify seul)
La console fonctionne en **mode local** : enregistrement dans le navigateur + bouton **Exporter la sauvegarde** (JSON) pour archiver. Netlify n'exécute pas de serveur Node permanent.

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
