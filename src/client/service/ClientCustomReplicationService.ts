import { Workspace } from "@rbxts/services";
import { Remotes } from "shared/Remotes";

export namespace ClientCustomReplicationService {
	const storage: Map<string, Instance> = new Map();

	export function initialize() {
		Remotes.Client.GetNamespace("Replication").Get("ClientSpawnBlock").Connect(onSpawnBlockEvent);
	}

	export function onSpawnBlockEvent(data: ReplicationSpawnBlock) {
		const block = new Instance("Model");
		block.Name = data.model.Name;

		const modelMap: { instance: Instance; instanceAddress: string; modelAddress: Instance }[] = [];

		// Create parts
		const modelParts = data.model.GetChildren().filter((value) => value.IsA("BasePart")) as BasePart[];
		for (const modelPart of modelParts) {
			// Get part definition address
			const instanceAddress = data.instanceAddressMap.get(modelPart)!;

			// Create part
			const workspacePart = modelPart.Clone();
			workspacePart.Parent = block;

			// Save data
			modelMap.push({
				instance: workspacePart,
				modelAddress: modelPart,
				instanceAddress,
			});
			storage.set(instanceAddress, workspacePart);
		}

		// Fix constraints (TODO)

		// Fix welds (TODO)

		// Fix primary part
		const primaryPart = modelMap.find((value) => data.model.PrimaryPart === value.modelAddress)!;
		block.PrimaryPart = primaryPart.instance as BasePart;

		block.Parent = Workspace;
	}
}
