import ServerFireEffect from "./FireEffect";
import ServerImpactSoundEffect from "./ImpactSoundEvent";
import ServerSparksEffect from "./SparksEffect";

export default class ServerEffects {
	static Sparks = new ServerSparksEffect();
	static ImpactSound = new ServerImpactSoundEffect();
	static Fire = new ServerFireEffect();
}
