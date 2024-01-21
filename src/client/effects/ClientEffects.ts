import ClientFireEffect from "./FireEffect";
import ClientImpactSoundEffect from "./ImpactSoundEffect";
import ClientSparksEffect from "./SparksEffect";

export default class ClientEffects {
	static readonly Sparks = new ClientSparksEffect();
	static ImpactSound = new ClientImpactSoundEffect();
	static Fire = new ClientFireEffect();
}
