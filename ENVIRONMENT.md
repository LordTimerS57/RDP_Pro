# Préparation des environnements de développement

Ce guide détaille, étape par étape, la mise en place des deux environnements
du projet : le **back** (API FastAPI + moteur NumPy, géré avec `uv`) et le
**front** (React/Vite, géré avec `npm`).

## Vue d'ensemble

| Composant | Langage / Runtime | Gestionnaire | Port par défaut |
| --------- | ------------------ | ------------ | ---------------- |
| back      | Python ≥ 3.14       | uv           | 8000              |
| front     | Node.js ≥ 20.19     | npm          | 5173              |

Les deux services sont indépendants au démarrage mais le front dialogue avec
le back en HTTP (`http://127.0.0.1:8000/api/...`, voir
`front/src/hooks/usePetriNet.js`). Il faut donc les deux environnements actifs
pour utiliser l'application complète.

---

## 1. Prérequis système

- **OS** : Linux, macOS ou Windows (WSL2 recommandé sous Windows pour éviter
  les soucis de chemins/permissions avec `uv` et les binaires natifs npm).
- **Git** installé, pour cloner le dépôt.
- Un terminal avec accès réseau (téléchargement des paquets Python/npm).

Vérifiez que le dépôt est bien cloné et que vous êtes à sa racine :

```bash
git clone <url-du-repo>
cd <nom-du-repo>
ls
# doit afficher : back/  front/  README.md  .gitignore
```

---

## 2. Environnement Back (Python + uv)

### 2.1. Installer `uv`

`uv` gère à la fois l'installation de Python et les dépendances du projet, il
n'est donc pas nécessaire d'installer Python séparément.

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Vérifiez l'installation :

```bash
uv --version
```

### 2.2. Installer la version de Python requise

Le projet cible Python **3.14** (fichier `back/.python-version`). `uv`
l'installera automatiquement au premier `uv sync`, mais vous pouvez le faire
explicitement :

```bash
cd back
uv python install 3.14
```

### 2.3. Créer l'environnement virtuel et installer les dépendances

```bash
cd back
uv sync
```

Cette commande :

- crée un environnement virtuel dans `back/.venv` (ignoré par git) ;
- installe les dépendances déclarées dans `pyproject.toml`
  (`fastapi[standard]`, `numpy`) en respectant les versions figées dans
  `uv.lock`.

### 2.4. Lancer le serveur de développement

```bash
cd back
uv run python run.py
```

Le serveur démarre sur `http://127.0.0.1:8000` avec rechargement automatique
(`reload=True` dans `run.py`). Alternative équivalente avec la CLI FastAPI :

```bash
uv run fastapi dev app/main.py
```

### 2.5. Vérifier que l'API répond

Dans un autre terminal :

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok"}

curl http://127.0.0.1:8000/api/state
# JSON avec marquage, matrices, transitions franchissables, etc.
```

La documentation interactive Swagger est disponible sur
`http://127.0.0.1:8000/docs`.

### 2.6. Commandes utiles

```bash
uv add <paquet>          # ajouter une dépendance
uv remove <paquet>       # retirer une dépendance
uv lock --upgrade        # mettre à jour uv.lock
uv run python -m pytest  # lancer les tests (si ajoutés)
```

---

## 3. Environnement Front (Node.js + npm)

### 3.1. Installer Node.js

Version requise : **≥ 20.19** (contrainte des dépendances Vite 8 /
`@eslint/js` 10). Utilisez de préférence un gestionnaire de versions :

```bash
# via nvm
nvm install 20
nvm use 20

# vérification
node --version
npm --version
```

### 3.2. Installer les dépendances

```bash
cd front
npm install
```

Cela installe React 19, Vite 8, Tailwind CSS 3, ESLint, `lucide-react`, etc.
d'après `package.json` / `package-lock.json`.

### 3.3. Lancer le serveur de développement

```bash
cd front
npm run dev
```

Vite démarre sur `http://localhost:5173` (port affiché dans le terminal) avec
Hot Module Replacement.

### 3.4. Vérifier l'intégration avec le back

Le hook `usePetriNet.js` pointe en dur vers
`const API = "http://127.0.0.1:8000/api"`. Assurez-vous donc que :

1. le back est lancé (étape 2.4) **avant** d'ouvrir le front ;
2. le CORS est ouvert côté back (`allow_origins=["*"]` dans `main.py`, déjà
   configuré pour le dev).

Ouvrez `http://localhost:5173` : l'écran doit passer de
« ⏳ Connexion au backend... » au graphe du réseau de Pétri.

### 3.5. Autres commandes

```bash
npm run build     # build de production dans front/dist
npm run preview   # sert le build de production localement
npm run lint      # ESLint sur le projet
```

---

## 4. Ordre de démarrage recommandé (dev quotidien)

```bash
# Terminal 1
cd back && uv run python run.py

# Terminal 2
cd front && npm run dev
```

Puis ouvrir `http://localhost:5173` dans le navigateur.

---

## 5. Problèmes courants

| Symptôme | Cause probable | Solution |
| -------- | --------------- | -------- |
| Front bloqué sur « Connexion au backend... » | Back non démarré ou port différent | Vérifier `uv run python run.py` actif sur le port 8000 |
| Erreur CORS dans la console navigateur | Back démarré sans `CORSMiddleware` actif | Vérifier `back/app/main.py`, relancer le serveur |
| `uv sync` échoue sur la version Python | Python 3.14 non disponible sur la machine | `uv python install 3.14` puis relancer `uv sync` |
| `npm install` très lent / erreurs de build natif (lightningcss, rolldown) | Version de Node trop ancienne | Passer à Node ≥ 20.19 (`nvm install 20`) |
| Port 8000 ou 5173 déjà utilisé | Un autre process écoute sur ce port | Libérer le port ou changer le port dans `run.py` / `vite.config.js` |
| Modifications back non prises en compte | Serveur lancé sans `reload` | Utiliser `run.py` (reload activé) ou `uv run fastapi dev` |

---

## 6. Variables d'environnement (optionnel)

Aucune variable d'environnement n'est requise pour le dev par défaut. Si vous
déployez en production, prévoyez au minimum :

- côté back : restreindre `allow_origins` dans `CORSMiddleware` au domaine du
  front (au lieu de `"*"`) ;
- côté front : externaliser l'URL de l'API (`API` dans `usePetriNet.js`) dans
  une variable Vite (`import.meta.env.VITE_API_URL`) plutôt qu'une valeur en
  dur, pour pouvoir la faire varier entre environnements.
