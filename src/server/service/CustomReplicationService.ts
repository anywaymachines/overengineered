export namespace CustomReplicationService {
	export function initialize() {}

	// export function spawnBlock(block: BlockModel, cframe: CFrame) {
	// 	const parts = block.GetChildren().filter((value) => value.IsA("BasePart")) as BasePart[];

	// 	const uuid = "TODO";

	// 	// Make model
	// 	Remotes.Server.GetNamespace("Replication").Get("ClientBlockInitialize").SendToAllPlayers({
	// 		uuid: uuid,
	// 		attributes: {},
	// 	});

	// 	// Make parts
	// 	parts.forEach((part) => {
	// 		const partUUID = HttpService.GenerateGUID(false);

	// 		Remotes.Server.GetNamespace("Replication")
	// 			.Get("ClientBasePartInitialize")
	// 			.SendToAllPlayers({
	// 				cframe: cframe.add(block.GetPivot().PointToObjectSpace(part.Position)),
	// 				parentUUID: uuid,
	// 				prefab: part,
	// 				uuid: partUUID,
	// 				owner: false, // TODO: Change
	// 			});
	// 	});
	// }
}
