# Console « Studio » — administration temps réel

Interface d'administration moderne (type Linear / Stripe), **ajoutée** au site sans
modifier une seule ligne de son design. Elle s'ouvre sur `#admin-pro` (ou `#studio`).

- **Aucune compilation, aucun CDN** : tout est déjà dans `index.html` (deux scripts
  autonomes + une feuille de style préfixée `.pro-*`).
- **Temps réel** : Supabase Realtime (WebSocket natif) + repli par sondage de 3 s
  (réseaux qui bloquent les WebSockets) + `BroadcastChannel` pour les onglets.
- **Site public synchronisé** : dès qu'un navigateur ou un téléphone ouvre le site,
  il reçoit le contenu publié (et les publications suivantes en direct).
- **Sans configuration**, la console fonctionne en **mode local** (rien ne change
  sur le site) : aucune régression possible avant vos clés.

---

## 1. Connecter Supabase en 2 minutes

### a) Créer le projet
1. <https://supabase.com> → **New project** (région la plus proche : *Europe / Frankfurt*),
   choisir un mot de passe de base de données, attendre ~1 min.

### b) Créer les tables et les règles de sécurité
2. **SQL Editor → New query** → coller tout le contenu de **`supabase-schema.sql`** →
   **Run**. Cela crée :
   - `ista_content` (contenu publié, lecture publique / écriture admin),
   - `ista_history` (historique des publications),
   - `ista_drafts` (brouillons par administrateur),
   - la diffusion **Realtime** sur `ista_content`,
   - le bucket public **`ista-media`** pour les images.

### c) Créer le compte administrateur
3. **Authentication → Users → Add user** : e-mail + mot de passe
   (pour un compte interne, décocher « Auto Confirm User » si l'option est proposée,
   ou cliquer le lien de confirmation).

### d) Copier les deux clés
4. **Project Settings → API** → copier **Project URL** et la clé **`anon public`**.
   ⚠️ Ne **jamais** utiliser la clé `service_role` dans le site.

### e) Renseigner la console (deux méthodes, au choix)
- **Sans toucher au code** (recommandé) : ouvrir `#admin-pro` → **Réglages** →
  coller l'URL et la clé → **Enregistrer la configuration** → **Tester la connexion**.
  (La configuration reste dans le navigateur : à refaire sur un autre appareil.)
- **Pour tous les appareils** : renseigner `url` et `anonKey` dans le fichier
  **`supabase.json`** placé à côté de `index.html`, puis le déposer sur le dépôt
  (GitHub → *Add file → Upload files*). Ce fichier ne contient que la clé **publique**.

> La clé `anon` est publique par nature : ce sont les **règles RLS** du fichier SQL
> qui empêchent toute écriture sans connexion (lecture seule pour les visiteurs).

---

## 2. Utilisation quotidienne

| Écran | Ce qu'on y fait |
|---|---|
| **Identité & thème** | Nom, slogan, logo (compressé), 4 couleurs, 2 polices. Option « Appliquer au site » (désactivée par défaut → le site garde son design). |
| **Pages & sections** | Les 11 pages et leurs rubriques réelles. Glisser-déposer pour réordonner, œil pour masquer, corbeille pour retirer, clic pour éditer les textes/HTML, import d'images en un clic, ajout de blocs (Bandeau, Texte, Galerie, FAQ, Appel à l'action). |
| **Menu & pied de page** | Liens du menu principal (ordre libre), réseaux sociaux. |
| **Médias** | Glisser-déposer des images : redimensionnées à 1600 px, JPEG 82 % ; en mode « Storage » elles partent dans Supabase, seule l'URL est conservée. |
| **SEO** | Meta title, description, image de partage, **aperçu Google** en direct, par page. |
| **Historique** | Les 30 dernières publications, restauration en un clic (retour dans le brouillon). |
| **Réglages** | Connexion Supabase, test, état du temps réel, mode des médias, session. |

**Brouillon vs publication**
- **Brouillon** : enregistre votre travail (cloud + appareil) sans rien publier.
- **Publier** : écrit la nouvelle version ; tous les navigateurs et téléphones
  reçoivent la mise à jour **en direct** (toast « Modifications publiées en direct »).

**Aperçu en direct** : colonne de droite, tailles **375 / 768 / 1440 px** au rendu
réel (mise à l'échelle automatique), bouton **Ouvrir** pour voir la page seule.
Un clic dans l'aperçu ouvre la rubrique correspondante dans l'éditeur.

**Thème** : bouton lune/soleil (clair / sombre), mémorisé.
**Mobile** : barre latérale en tiroir, panneaux empilés, boutons compacts.

---

## 3. Ce qui a été testé (navigateur réel)

| Test | Résultat |
|---|---|
| Connexion e-mail / mot de passe | écran de connexion, session conservée, déconnexion |
| Publication depuis un navigateur | contenu écrit côté serveur (v7), entrée d'historique créée |
| **Autre navigateur** (2ᵉ administrateur, page déjà ouverte) | reçoit la publication **sans rechargement** |
| **Visiteur** (navigateur distinct) | voit le contenu publié immédiatement |
| **iPhone 13** (mobile) | voit le contenu publié et les mises à jour suivantes |
| Erreurs JavaScript | 0 |
| Mode local (sans Supabase) | console complète, site inchangé |

Non testable depuis cet environnement (à faire chez vous, 1 min) : la **connexion
Supabase réelle** (WebSocket `realtime`) — utilisez le bouton **Tester la connexion**.
Le repli par sondage de 3 s garantit la mise à jour même si les WebSockets sont bloqués.

---

## 4. Dépannage

| Symptôme | Cause / solution |
|---|---|
| « Supabase non configuré » | Réglages → coller URL + clé → Enregistrer → Tester. |
| « Publication impossible : Connexion requise » | Le compte s'est déconnecté (jeton 1 h) : se reconnecter — le rafraîchissement est automatique ensuite. |
| « Lecture impossible : permission denied » | Le SQL n'a pas été exécuté (RLS active sans politique) : relancer `supabase-schema.sql`. |
| Le temps réel reste « non connecté » | WebSocket bloqué (proxy/entreprise) : le sondage de 3 s prend le relais, les mises à jour arrivent quand même. |
| Les images gonflent le contenu | Réglages → activer « Stocker les images dans Supabase Storage » (bucket `ista-media`). |
| Rien ne change sur le site | Publier (pas seulement « Brouillon »), puis vérifier `#admin-pro` → Réglages → état du temps réel. |
| Revenir à l'ancienne console | `#admin` (inchangée) — les deux consoles coexistent. |

---

## 5. Fichiers

```
index.html          site complet + console Studio (2 scripts, CSS .pro-*)
supabase.json       configuration (URL + clé publique) — facultatif
supabase-schema.sql tables, RLS, temps réel, bucket (à exécuter une fois)
```

Rien d'autre à installer : `python3 -m http.server` suffit pour essayer,
et Netlify / GitHub Pages / Render publient le fichier tel quel.
