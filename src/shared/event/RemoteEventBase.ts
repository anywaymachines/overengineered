import { ReplicatedStorage, RunService } from "@rbxts/services";

export type CreatableRemoteEvents = "UnreliableRemoteEvent" | "RemoteEvent";
export abstract class RemoteEventBase<T, TEvent extends Instance> {
	readonly event: TEvent;

	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		if (RunService.IsServer()) {
			if (ReplicatedStorage.FindFirstChild(name)) {
				throw `${eventType} ${name} elready exists!!! fix!!!`;
			}

			this.event = new Instance(eventType) as unknown as TEvent;
			this.event.Name = name;
			this.event.Parent = ReplicatedStorage;
		} else {
			this.event = ReplicatedStorage.WaitForChild(name) as TEvent;
		}
	}
}
