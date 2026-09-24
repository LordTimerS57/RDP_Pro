from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .petri_net import PetriNet
from .models import FireRequest, CapacityRequest

app = FastAPI(title="Petri Net Parking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only — restreindre en prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instance unique en mémoire (remplacer par un store par session en prod)
net = PetriNet(capacity=5)


@app.get("/api/state")
def get_state():
    """Retourne l'état complet du réseau."""
    return net.snapshot()


@app.post("/api/fire")
def fire(req: FireRequest):
    """Tire une transition."""
    try:
        return net.fire(req.transition)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/reset")
def reset():
    """Réinitialise au marquage initial M0."""
    net.reset()
    return net.snapshot()


@app.post("/api/capacity")
def set_capacity(req: CapacityRequest):
    """Configure la capacité du parking (et reset)."""
    try:
        net.set_capacity(req.capacity)
        return net.snapshot()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "ok"}