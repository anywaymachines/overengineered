import ClientFireEffect from "./FireEffect";
import ClientImpactSoundEffect from "./ImpactSoundEffect";
import ClientSparksEffect from "./SparksEffect";

const ClientEffects = {
	Sparks: new ClientSparksEffect(),
	ImpactSound: new ClientImpactSoundEffect(),
	Fire: new ClientFireEffect(),
} as const;

export default ClientEffects;
