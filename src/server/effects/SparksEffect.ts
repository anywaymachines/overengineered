import { UnreliableRemotes } from "shared/Remotes";
import ServerEffectBase from "./ServerEffectBase";

export default class ServerSparksEffect extends ServerEffectBase<SparksEffectArgs> {
	constructor() {
		super(UnreliableRemotes.CreateSparks);
	}
}
