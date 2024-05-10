import { $log } from "rbxts-transformer-macros";
import { BlockId } from "shared/BlockDataRegistry";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Objects } from "shared/fixes/objects";

export namespace BlockMarkers {
	export const markers: {
		readonly [id in BlockId]?: { readonly [name in BlockConnectionName]?: Vector3 };
	} = {};

	export function initialize() {
		initPartBlockCollisions(BlocksInitializer.blocks.sorted);
	}

	function initPartBlockCollisions(blocks: readonly RegistryBlock[]) {
		const weldFolderName = "MarkerPoints";

		const markers: Writable<typeof BlockMarkers.markers> = BlockMarkers.markers;
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
			markers[block.id] = Objects.asObject(positions);

			folder.Destroy();
		};

		for (const block of blocks) {
			create(block);
		}

		$log("Block markers initialized");
	}
}
