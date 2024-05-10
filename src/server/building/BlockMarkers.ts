import { BlockId } from "shared/BlockDataRegistry";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Logger } from "shared/Logger";
import { Objects } from "shared/fixes/objects";

const logger = new Logger("BlockMarkers");

export namespace BlockMarkers {
	export const markers: { readonly [id in BlockId]?: { readonly [name: BlockConnectionName]: Vector3 } } = {};

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
					(p) => [p.Name as BlockConnectionName, p.GetPivot().Position] as const,
				),
			);

			logger.info(`Block markers initialized for block ${block.id}: (${positions.size()})`);
			markers[block.id] = Objects.asObject(positions);

			folder.Destroy();
		};

		for (const block of blocks) {
			create(block);
		}

		logger.info("Block markers initialized");
	}
}
