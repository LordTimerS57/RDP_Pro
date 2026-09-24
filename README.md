# Réseau de Pétri — Gestion de Parking

Simulateur interactif d'un réseau de Pétri modélisant la gestion d'un parking
avec barrières d'entrée/sortie et réservation de place. Le moteur de
simulation (matrices d'incidence, marquage, franchissement) tourne côté
serveur en Python/NumPy et est piloté via une API REST ; l'interface web en
React affiche le graphe du réseau, les matrices et l'historique des tirs.

## Aperçu du modèle

Le réseau compte **10 places** (P1 à P10) et **5 transitions** (T1 à T5) :

| Place | Signification                          |
| ----- | --------------------------------------- |
| P1    | Voiture en attente                      |
| P2    | Voiture entrante                        |
| P3    | Voiture garée                           |
| P4    | Voiture sortante                        |
| P5    | Barrière d'entrée FERMÉE                |
| P6    | Barrière d'entrée OUVERTE               |
| P7    | Barrière de sortie FERMÉE               |
| P8    | Barrière de sortie OUVERTE              |
| P9    | Places disponibles (ressource)          |
| P10   | Réservation (place réservée en cours d'entrée) |

| Transition | Signification                          |
| ---------- | --------------------------------------- |
| T1         | Arrivée d'une voiture                   |
| T2         | Ouverture barrière d'entrée + réservation |
| T3         | Entrée du véhicule dans le garage        |
| T4         | Sortie du véhicule                       |
| T5         | Fermeture / réarmement des barrières     |

Le moteur (`back/app/petri_net.py`) construit les matrices `Pre`, `Post` et
`W = Post - Pre`, et fait évoluer le marquage `M` selon
`M' = M + W[:, t]` lorsqu'une transition `t` est franchissable
(`M >= Pre[:, t]`).

## Structure du dépôt

```
.
├── back/     # API FastAPI + moteur NumPy du réseau de Pétri
│   ├── app/
│   │   ├── main.py         # Routes FastAPI (/api/state, /api/fire, ...)
│   │   ├── petri_net.py    # Moteur matriciel du réseau
│   │   └── models.py       # Schémas Pydantic des requêtes
│   ├── run.py               # Lancement uvicorn (dev)
│   └── pyproject.toml
└── front/    # Interface React (Vite + Tailwind)
    └── src/
        ├── App.jsx
        ├── hooks/usePetriNet.js      # Appels API + simulation auto
        └── components/
            ├── PetriNetGraph.jsx     # Vue graphe SVG du réseau
            ├── ControlPanel.jsx      # Tirs manuels, capacité, reset
            ├── MatrixDisplay.jsx     # Matrices Pre/Post/W
            └── EventLog.jsx          # Journal des événements
```

## Prérequis

- **Python** ≥ 3.14 avec [uv](https://docs.astral.sh/uv/) pour la gestion des
  dépendances du back
- **Node.js** ≥ 20.19 avec npm pour le front

## Démarrage — Back (API FastAPI)

```bash
cd back
uv sync
uv run python run.py
```

L'API est servie sur `http://127.0.0.1:8000` (rechargement automatique
activé). Endpoints principaux :

| Méthode | Route              | Description                                  |
| ------- | ------------------ | --------------------------------------------- |
| GET     | `/api/state`       | État complet du réseau (marquage, matrices…)  |
| POST    | `/api/fire`        | Tire une transition (`{"transition": 0..4}`)  |
| POST    | `/api/reset`       | Réinitialise au marquage initial `M0`         |
| POST    | `/api/capacity`    | Change la capacité du parking et réinitialise |
| GET     | `/api/health`      | Contrôle de santé                             |

## Démarrage — Front (React)

```bash
cd front
npm install
npm run dev
```

L'interface est servie par Vite (par défaut sur `http://localhost:5173`) et
communique avec l'API back sur `http://127.0.0.1:8000`.

## Fonctionnalités de l'interface

- Vue graphique du réseau (places, transitions, arcs, jetons animés)
- Panneau de contrôle : tir manuel des transitions, simulation automatique
  avec vitesse réglable, ajustement de la capacité du parking, réinitialisation
- Affichage des matrices d'incidence `Pre`, `Post` et `W`
- Journal des événements horodaté (succès/échec de franchissement)

## Licence

Projet pédagogique — usage libre.
