import { Controller } from "shared/component/Controller";
import type { BlockRegistryC } from "shared/block/BlockRegistry";
import type { BlockId } from "shared/BlockDataRegistry";

@injectable
export class BlockMarkersController extends Controller {
	readonly markers: { readonly [id in BlockId]?: { readonly [name in BlockConnectionName]?: Vector3 } } = {};

	constructor(@inject blockRegistry: BlockRegistryC) {
		super();
		this.initPartBlockCollisions(blockRegistry.sorted);
	}

	private initPartBlockCollisions(blocks: readonly RegistryBlock[]) {
		const weldFolderName = "MarkerPoints";

		const markers: Writable<typeof this.markers> = this.markers;
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

		for (const block of blocks) {
			create(block);
		}

		$log("Block markers initialized");
	}
}
