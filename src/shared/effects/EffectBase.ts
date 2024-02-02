import { CreatableRemoteEvents } from "shared/event/RemoteEventBase";
import S2CRemoteEvent from "shared/event/S2CRemoteEvent";

export default abstract class EffectBase<T> extends S2CRemoteEvent<T> {
	static staticMustSendToPlayer?: (player: Player) => boolean;

	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		super(name, eventType);
	}

	protected mustSendToPlayer(player: Player): boolean {
		return EffectBase.staticMustSendToPlayer?.(player) ?? super.mustSendToPlayer(player);
	}
}
