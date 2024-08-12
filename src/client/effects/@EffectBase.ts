import { BidirectionalRemoteEvent } from "shared/event/PERemoteEvent";
import type { CreatableRemoteEvents } from "shared/event/RemoteEventBase";

abstract class ClientEffectBase<T> {
	protected readonly event;

	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		this.event = new BidirectionalRemoteEvent<T>(name, eventType);
		this.event.s2c.invoked.Connect((arg) => this.justRun(arg));
	}

	protected abstract justRun(arg: T): void;

	send(ownerPart: BasePart, arg: T): void {
		this.justRun(arg);
		this.event.c2s.send(arg);
	}
}
export { ClientEffectBase as EffectBase };
