import { Players } from "@rbxts/services";
import { _UnreliableRemoteEvent } from "shared/Remotes";
import { EffectsInvoker } from "./EffectsInvoker";

type EffectEventType<T> = _UnreliableRemoteEvent<(part: BasePart, arg: T) => void>;
export default abstract class EffectBase<T> {
	readonly event: EffectEventType<T>;

	constructor(event: EffectEventType<T>) {
		this.event = event;
	}

	/** Create the effect. */
	abstract justCreate(part: BasePart, arg: T): void;

	/** Create the effect locally and send it to the other players.
	 * @client
	 */
	send(part: BasePart, arg: T): void;

	/** Send the effect to the other players
	 * @server
	 */
	send(part: BasePart, arg: T, forcePlayer: Player | "everyone"): void;

	send(part: BasePart, arg: T, forcePlayer?: Player | "everyone" | undefined): void {
		EffectsInvoker.invoke(part, arg, forcePlayer ?? Players.LocalPlayer, this.event);
	}
}
