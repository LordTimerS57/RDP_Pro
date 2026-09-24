"""
Moteur de Réseau de Pétri vectoriel (NumPy).

Modèle : Système de gestion de parking AVEC RÉSERVATION (P10)
Places  : P1..P10
Transitions : T1..T5

  P1  : Voiture en attente (entrée)
  P2  : Voiture entrante
  P3  : Voiture garée
  P4  : Voiture sortante
  P5  : Barrière d'entrée FERMÉE
  P6  : Barrière d'entrée OUVERTE
  P7  : Barrière de sortie FERMÉE
  P8  : Barrière de sortie OUVERTE
  P9  : Places disponibles
  P10 : Réservation (place réservée pour une voiture en cours d'entrée)
"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict


# ---------------------------------------------------------------------------
# Définition topologique du réseau
# ---------------------------------------------------------------------------
PLACE_LABELS = {
    "P1":  "Voiture en attente",
    "P2":  "Voiture entrante",
    "P3":  "Voiture garée",
    "P4":  "Voiture sortante",
    "P5":  "Barrière entrée FERMÉE",
    "P6":  "Barrière entrée OUVERTE",
    "P7":  "Barrière sortie FERMÉE",
    "P8":  "Barrière sortie OUVERTE",
    "P9":  "Places disponibles",
    "P10": "Réservation",
}

TRANSITION_LABELS = {
    "T1": "Arrivée voiture (P1)",
    "T2": "Ouverture barrière + réservation",
    "T3": "Entrée véhicule (garage)",
    "T4": "Sortie véhicule",
    "T5": "Fermeture / réarmement barrières",
}


@dataclass
class PetriNet:
    """Réseau de Pétri pondéré avec moteur matriciel NumPy (10 places, 5 transitions)."""

    capacity: int = 5  # 'n' : nombre de places totales du parking

    M: np.ndarray = field(init=False)              # Marquage courant (10,)
    Pre: np.ndarray = field(init=False)            # Pré-incidence (10, 5)
    Post: np.ndarray = field(init=False)           # Post-incidence (10, 5)
    W: np.ndarray = field(init=False)              # Incidence W = Post - Pre
    history: List[Dict] = field(default_factory=list)

    # -----------------------------------------------------------------------
    def __post_init__(self) -> None:
        self._build_matrices()
        self.reset()

    # -----------------------------------------------------------------------
    def _build_matrices(self) -> None:
        """
        Construit Pre (10x5) et Post (10x5).

        Indices places  : P1=0, P2=1, ..., P10=9
        Indices trans.  : T1=0, T2=1, T3=2, T4=3, T5=4
        """
        Pre  = np.zeros((10, 5), dtype=np.int64)
        Post = np.zeros((10, 5), dtype=np.int64)

        # --- T1 : Arrivée voiture => produit 1 jeton dans P1 (source externe)
        Post[0, 0] = 1  # P1

        # --- T2 : Ouverture barrière + réservation
        # Entrées : P1 (voiture en attente), P5 (barrière fermée), P9 (place dispo)
        # Sorties : P2 (voiture entrante), P6 (barrière ouverte), P10 (réservation)
        Pre[0, 1] = 1   # P1
        Pre[4, 1] = 1   # P5
        Pre[8, 1] = 1   # P9  ← place consommée ici
        Post[1, 1] = 1  # P2
        Post[5, 1] = 1  # P6
        Post[9, 1] = 1  # P10 ← réservation produite ici

        # --- T3 : Entrée véhicule (garage)
        # Entrées : P2 (voiture entrante), P6 (barrière ouverte), P10 (réservation)
        # Sorties : P3 (voiture garée), P5 (barrière fermée)
        Pre[1, 2] = 1   # P2
        Pre[5, 2] = 1   # P6
        Pre[9, 2] = 1   # P10 ← réservation consommée ici (PAS P9 !)
        Post[2, 2] = 1  # P3
        Post[4, 2] = 1  # P5

        # --- T4 : Sortie véhicule
        # Entrées : P3 (voiture garée), P7 (barrière sortie fermée)
        # Sorties : P4 (voiture sortante), P8 (barrière ouverte), P9 (place libérée)
        Pre[2, 3] = 1   # P3
        Pre[6, 3] = 1   # P7
        Post[3, 3] = 1  # P4
        Post[7, 3] = 1  # P8
        Post[8, 3] = 1  # P9 ← place libérée ici

        # --- T5 : Réarmement barrières
        # Entrées : P4 (voiture sortante), P8 (barrière sortie ouverte)
        # Sorties : P7 (barrière sortie fermée)
        Pre[3, 4] = 1   # P4
        Pre[7, 4] = 1   # P8
        Post[6, 4] = 1  # P7

        self.Pre  = Pre
        self.Post = Post
        self.W    = Post - Pre

    # -----------------------------------------------------------------------
    def reset(self) -> None:
        """Réinitialise le marquage à M0."""
        M0 = np.zeros(10, dtype=np.int64)
        M0[0] = 0              # P1  : Voiture en attente
        M0[1] = 0              # P2  : Voiture entrante
        M0[2] = 0              # P3  : Voiture garée
        M0[3] = 0              # P4  : Voiture sortante
        M0[4] = 1              # P5  : Barrière entrée FERMÉE
        M0[5] = 0              # P6  : Barrière entrée OUVERTE
        M0[6] = 1              # P7  : Barrière sortie FERMÉE
        M0[7] = 0              # P8  : Barrière sortie OUVERTE
        M0[8] = self.capacity  # P9  : n places disponibles
        M0[9] = 0              # P10 : aucune réservation

        self.M = M0
        self.history = [{
            "step": 0,
            "action": "RESET",
            "marking": self.M.tolist(),
            "message": f"Réinitialisation — M0 = {self.M.tolist()}",
        }]

    # -----------------------------------------------------------------------
    def is_enabled(self, t_index: int) -> bool:
        """Vérifie si la transition t est franchissable : M >= Pre[:, t]."""
        return bool(np.all(self.M >= self.Pre[:, t_index]))

    # -----------------------------------------------------------------------
    def fire(self, t_index: int) -> Dict:
        """
        Tire la transition t_index.
        Équation : M' = M + W[:, t_index]
        """
        if not (0 <= t_index < 5):
            raise ValueError(f"Index de transition invalide : {t_index}")

        label = list(TRANSITION_LABELS.keys())[t_index]

        if not self.is_enabled(t_index):
            entry = {
                "step": len(self.history),
                "action": f"{label} (refusée)",
                "marking": self.M.tolist(),
                "message": f"❌ {label} NON franchissable",
                "success": False,
            }
            self.history.append(entry)
            return entry

        # Tir vectoriel : M' = M + W[:, t]
        self.M = self.M + self.W[:, t_index]

        entry = {
            "step": len(self.history),
            "action": label,
            "marking": self.M.tolist(),
            "message": f"✅ {label} tirée — M = {self.M.tolist()}",
            "success": True,
        }
        self.history.append(entry)
        return entry

    # -----------------------------------------------------------------------
    def set_capacity(self, n: int) -> None:
        """Change la capacité du parking et réinitialise."""
        if n < 1:
            raise ValueError("La capacité doit être ≥ 1")
        self.capacity = int(n)
        self.reset()

    # -----------------------------------------------------------------------
    def snapshot(self) -> Dict:
        """État complet sérialisable pour l'API."""
        return {
            "capacity": self.capacity,
            "marking": self.M.tolist(),
            "place_labels": PLACE_LABELS,
            "transition_labels": TRANSITION_LABELS,
            "enabled": [self.is_enabled(i) for i in range(5)],
            "matrices": {
                "Pre": self.Pre.tolist(),
                "Post": self.Post.tolist(),
                "W": self.W.tolist(),
            },
            "history": self.history[-50:],
        }