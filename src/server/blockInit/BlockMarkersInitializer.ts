import type { BlockId } from "shared/BlockDataRegistry";

export namespace BlockMarkerInitializer {
	function create(id: BlockId, model: BlockModel) {
		const folderName = "MarkerPoints";

		const folder = model.FindFirstChild(folderName) as Folder | undefined;
		if (!folder) return;

		const positions = (folder.GetChildren() as BasePart[]).mapToMap((p) =>
			$tuple(p.Name as BlockConnectionName, model.GetPivot().PointToObjectSpace(p.GetPivot().Position)),
		);

		$log(`Block markers initialized for block ${id}: (${positions.size()})`);
		folder.Destroy();

		return asObject(positions);
	}

	type RegistryBlock = {
		readonly id: BlockId;
		readonly model: BlockModel;
		markerPositions?: { readonly [name in BlockConnectionName]?: Vector3 };
	};
	export function initialize<T extends RegistryBlock>(
		block: T,
	): asserts block is T & { markerPositions: RegistryBlock["markerPositions"] & defined } {
		block.markerPositions = create(block.id, block.model);
	}
}
