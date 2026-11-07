# Méthode de travail Git

Projet : application mobile de suivi des médicaments (offline-first).

## Principe

Personne ne code directement sur `main` ni sur `develop`. Chaque tâche a sa branche, fusionnée via une Pull Request (PR) relue par une autre personne, et validée par la CI.

```text
feature/ta-tache  →  develop  →  main
  (ton travail)     (intégration)  (version stable)
```

## Les branches

| Branche | Rôle |
| --- | --- |
| `main` | Version stable, présentable. Reçoit `develop` à la fin d'une étape qui fonctionne. |
| `develop` | Intégration : on y rassemble le travail de tout le monde. |
| `feature/<nom>` | Une nouvelle fonctionnalité. |
| `fix/<nom>` | Correction d'un bug. |
| `chore/<nom>` | Configuration, CI, Docker, documentation. |

Seules `main` et `develop` sont permanentes. Les autres sont créées au début d'une tâche et supprimées après la fusion.

## Branches prévues

| Tâche | Branche |
| --- | --- |
| CI backend | `chore/ci-backend` |
| Navigation Expo | `feature/navigation` |
| SQLite : schéma et tables | `feature/sqlite-setup` |
| Ordonnances et médicaments | `feature/ordonnances` |
| Notifications locales | `feature/notifications-locales` |
| Suivi des prises | `feature/suivi-prises` |
| Historique et tableau de bord | `feature/historique` |
| API Express + PostgreSQL | `feature/api-backend` |
| Docker Compose | `chore/docker` |
| Synchronisation | `feature/sync` |
| Build APK (EAS) | `chore/eas-build` |

## Première installation

```bash
git clone https://github.com/tinhinxne/DevOps-MiniProject
cd DevOps-MiniProject
git checkout develop
cd mobile
npm install
```

## Démarche pour chaque tâche

### 1. Partir de develop à jour

```bash
git checkout develop
git pull origin develop
git checkout -b feature/sqlite-setup
```

### 2. Coder et committer

```bash
git add .
git commit -m "feat(mobile): création des tables SQLite"
```

### 3. Pousser la branche

```bash
git push -u origin feature/sqlite-setup
```

### 4. Ouvrir une Pull Request

- De `feature/sqlite-setup` vers `develop` (jamais vers `main`).
- Remplir le modèle de PR.
- Demander la relecture d'une autre personne.

### 5. Fusion

- La CI doit être verte.
- Les remarques du relecteur sont corrigées sur la même branche.
- Merge dans `develop`, puis suppression de la branche.

### 6. Mettre à jour son poste

```bash
git checkout develop
git pull origin develop
git branch -d feature/sqlite-setup
```

## Messages de commit

| Préfixe | Usage |
| --- | --- |
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `chore:` | Configuration, outils, CI |
| `test:` | Tests |
| `docs:` | Documentation |

Format : `type(zone): description`, par exemple `fix(backend): corrige le code 404 sur la route sync`.

## Quand fusionner develop dans main

À la fin d'une étape stable (par exemple : l'app fonctionne hors-ligne avec SQLite, rappels et prises). On ouvre une PR `develop` vers `main`, on vérifie, puis on fusionne.

## Règles d'équipe

- Toujours `git pull origin develop` avant de créer une branche.
- Une branche = une tâche, courte (quelques jours).
- Pas de fusion sans relecture d'une autre personne.
- Pas de fusion si la CI est rouge.
- Jamais de secrets (`.env`, clés, tokens) dans le dépôt : il est public.
- Jamais de `git push --force` sur `main` ou `develop`.
- Après un `git pull`, refaire `npm install` si des dépendances ont changé.
- Écrire des tests avec chaque fonctionnalité.

## Conflits

```bash
git checkout develop
git pull origin develop
git checkout feature/ma-branche
git merge develop
```

Résoudre les fichiers en conflit dans VS Code, puis :

```bash
git add .
git commit
git push
```

## Configuration du dépôt (une seule fois)

1. Créer `develop` : `git checkout -b develop` puis `git push -u origin develop`.
2. Ajouter toute l'équipe en collaboratrices (Settings → Collaborators, rôle Write).
3. Protéger `main` et `develop` (Settings → Branches) : exiger une Pull Request et que le contrôle `backend` de la CI réussisse avant fusion.