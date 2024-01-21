import ServerImpactSoundEffect from "./ImpactSoundEvent";
import ServerSparksEffect from "./SparksEffect";

export default class ServerEffects {
	static Sparks = new ServerSparksEffect();
	static ImpactSound = new ServerImpactSoundEffect();
}
