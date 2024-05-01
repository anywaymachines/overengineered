import { Workspace } from "@rbxts/services";
import { Remotes } from "shared/Remotes";

export namespace ClientCustomReplicationService {
	const storage: Map<string, Instance> = new Map();
	const defaultFolder = Workspace;

	export function initialize() {
		Remotes.Client.GetNamespace("Replication").Get("ClientBlockInitialize").Connect(onBlockInitializePacket);
		Remotes.Client.GetNamespace("Replication").Get("ClientBasePartInitialize").Connect(onPartInitializePacket);
	}

	function onBlockInitializePacket(data: ReplicationClientBlockInitialize) {
		const blockModel = new Instance("Model");
		blockModel.Name = data.uuid;

		if (data.attributes) {
			for (const [name, value] of pairs(data.attributes)) {
				blockModel.SetAttribute(name, value);
			}
		}

		blockModel.Parent = defaultFolder;
		storage.set(data.uuid, blockModel);
	}

	function onPartInitializePacket(data: ReplicationClientBasePartInitialize) {
		const part = data.prefab.Clone();
		part.Anchored = true;
		part.CFrame = data.cframe;

		// Define PrimaryPart
		const parent = data.parentUUID !== undefined ? storage.get(data.parentUUID)! : defaultFolder;

		if ((data.prefab.Parent as Model).PrimaryPart === data.prefab) {
			(parent as Model).PrimaryPart = part;
		}

		part.Parent = parent;

		storage.set(data.uuid, part);
	}
}
