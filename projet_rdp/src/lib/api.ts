import type {
	Arc,
	ArcCreate,
	PetriNet,
	PetriNetCreate,
	PetriNetUpdate,
	Place,
	PlaceCreate,
	SimulationResult,
	Transition,
	TransitionCreate,
} from "#/types/petri";

const API_BASE_URL: string =
	import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/petri";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: { "Content-Type": "application/json" },
		...options,
	});

	if (!response.ok) {
		let detail = response.statusText;
		try {
			const body = await response.json();
			detail =
				typeof body.detail === "string" ? body.detail : JSON.stringify(body);
		} catch {
			// corps de réponse non JSON : on garde statusText
		}
		throw new Error(`${response.status} - ${detail}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}
	return (await response.json()) as T;
}

export const petriApiClient = {
	// --- Réseaux ---
	getAllNets: () => request<PetriNet[]>("/nets"),

	getNet: (netId: string) => request<PetriNet>(`/nets/${netId}`),

	createNet: (data: PetriNetCreate) =>
		request<PetriNet>("/nets", {
			method: "POST",
			body: JSON.stringify(data),
		}),

	updateNet: (netId: string, data: PetriNetUpdate) =>
		request<PetriNet>(`/nets/${netId}`, {
			method: "PUT",
			body: JSON.stringify(data),
		}),

	deleteNet: (netId: string) =>
		request<void>(`/nets/${netId}`, { method: "DELETE" }),

	// --- Éléments ---
	addPlace: (netId: string, data: PlaceCreate) =>
		request<Place>(`/nets/${netId}/places`, {
			method: "POST",
			body: JSON.stringify(data),
		}),

	addTransition: (netId: string, data: TransitionCreate) =>
		request<Transition>(`/nets/${netId}/transitions`, {
			method: "POST",
			body: JSON.stringify(data),
		}),

	addArc: (netId: string, data: ArcCreate) =>
		request<Arc>(`/nets/${netId}/arcs`, {
			method: "POST",
			body: JSON.stringify(data),
		}),

	// --- Simulation ---
	getEnabledTransitions: (netId: string) =>
		request<string[]>(`/nets/${netId}/enabled`),

	fireTransition: (netId: string, transitionId: string) =>
		request<Record<string, number>>(
			`/nets/${netId}/fire/${transitionId}`,
			{ method: "POST" },
		),

	simulateNet: (netId: string, maxSteps = 100) =>
		request<SimulationResult>(`/nets/${netId}/simulate?max_steps=${maxSteps}`, {
			method: "POST",
		}),

	resetMarking: (netId: string) =>
		request<void>(`/nets/${netId}/reset`, { method: "POST" }),
};
