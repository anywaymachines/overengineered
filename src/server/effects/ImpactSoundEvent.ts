import { UnreliableRemotes } from "shared/Remotes";
import ServerEffectBase from "./ServerEffectBase";

export default class ServerImpactSoundEffect extends ServerEffectBase<ImpactSoundEffectArgs> {
	constructor() {
		super(UnreliableRemotes.ImpactSound);
	}
}
