import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { BlockId } from "shared/BlockDataRegistry";

export class BlockMarkers {
	static initialize(blockRegistry: BlockRegistry) {
		const weldFolderName = "MarkerPoints";

		const markers: Writable<BlockMarkers["markers"]> = {};
		const create = (block: RegistryBlock) => {
			const folder = block.model.FindFirstChild(weldFolderName) as Folder | undefined;
			if (!folder) return;

			const positions = new Map(
				(folder.GetChildren() as BasePart[]).map(
					(p) =>
						[
							p.Name as BlockConnectionName,
							block.model.GetPivot().PointToObjectSpace(p.GetPivot().Position),
						] as const,
				),
			);

			$log(`Block markers initialized for block ${block.id}: (${positions.size()})`);
			markers[block.id] = asObject(positions);

			folder.Destroy();
		};

		for (const block of blockRegistry.sorted) {
			create(block);
		}

		$log("Block markers initialized");
		return new BlockMarkers(markers);
	}

	readonly markers: { readonly [id in BlockId]?: { readonly [name in BlockConnectionName]?: Vector3 } };

	constructor(markers: BlockMarkers["markers"]) {
		this.markers = markers;
	}
}
