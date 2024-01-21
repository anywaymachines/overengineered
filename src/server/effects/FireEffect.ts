import { UnreliableRemotes } from "shared/Remotes";
import ServerEffectBase from "./ServerEffectBase";

export default class ServerFireEffect extends ServerEffectBase<FireEffectArgs> {
	constructor() {
		super(UnreliableRemotes.FireEffect);
	}
}
