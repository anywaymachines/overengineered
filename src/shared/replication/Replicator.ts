import { HttpService, RunService, Workspace } from "@rbxts/services";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import { AutoS2CRemoteEvent } from "shared/event/S2CRemoteEvent";

type IID = string & { readonly ___nominal: unique symbol };

const tracked = new Map<IID, Instance>();

namespace Events {
	export type CloneParams<T extends Instance = Instance> = {
		readonly source: T;
		readonly props?: Partial<T>;
	};
	export const clone = new AutoS2CRemoteEvent<CloneParams>("replicator_clone", "RemoteEvent");
}

if (RunService.IsServer()) {
	task.delay(10, () => {
		Events.clone.send("everyone", {
			source: ReplicatedAssets.get<{ Placeable: { Blocks: { Block: Model } } }>().Placeable.Blocks.Block,
			props: {
				Name: "TEST OMEGA BOBA",
				Parent: Workspace,
			},
		});
	});
} else {
	Events.clone.invoked.Connect(({ source, props }) => {
		const cloned = Replicator.cloneFrom(source);

		if (props) {
			for (const [key, value] of pairs(props)) {
				cloned.instance[key as never] = value as never;
			}
		}
	});
}

export namespace Replicator {
	function newInstanceId() {
		return HttpService.GenerateGUID() as IID;
	}
	function track(instance: Instance): IID {
		const id = newInstanceId();
		tracked.set(id, instance);

		// TODO: subscribe destroyed/parent changed
		// OR a weak table somehow???

		return id;
	}

	type cloneFromRet<T> = {
		readonly instance: T;
		readonly ids: ReadonlyMap<IID, Instance>;
	};
	export function cloneFrom<T extends Instance>(source: T): cloneFromRet<T> {
		const instance = source.Clone();
		const ids = new Map<IID, Instance>();

		for (const child of instance.GetDescendants()) {
			const id = track(child);
			ids.set(id, child);
		}

		return { instance, ids };
	}
}
