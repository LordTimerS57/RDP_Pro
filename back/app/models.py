from pydantic import BaseModel, Field


class FireRequest(BaseModel):
    transition: int = Field(..., ge=0, le=4, description="Index T1..T5 (0..4)")


class CapacityRequest(BaseModel):
    capacity: int = Field(..., ge=1, le=100, description="Nombre de places n")