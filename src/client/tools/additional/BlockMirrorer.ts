import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { BuildingManager } from "shared/building/BuildingManager";
import { Component } from "shared/component/Component";
import { ObservableValue } from "shared/event/ObservableValue";
import type { BlockRegistry } from "shared/block/BlockRegistry";
import type { BlockId } from "shared/BlockDataRegistry";

@injectable
export class BlockMirrorer extends Component {
	readonly blocks = new ObservableValue<readonly { readonly id: BlockId; readonly model: Model }[]>([]);
	private readonly tracking = new Map<Model, Partial<Record<BlockId, Model[]>>>();

	constructor(@inject private readonly blockRegistry: BlockRegistry) {
		super();
		this.onDisable(() => this.destroyMirrors());
	}

	getCount() {
		let count = 0;
		for (const [, track] of this.tracking) {
			count += asMap(track).size();
		}

		return count;
	}

	getMirroredModels(): Readonly<Record<BlockId, readonly Model[]>> {
		const ret: Partial<Record<BlockId, Model[]>> = {};
		for (const [, track] of this.tracking) {
			for (const [id, models] of pairs(track)) {
				ret[id] ??= [];

				for (const model of models) {
					ret[id]!.push(model);
				}
			}
		}

		return ret as Record<BlockId, readonly Model[]>;
	}

	updatePositions(plot: PlotModel, mode: MirrorMode) {
		const blocks = this.blocks.get();

		for (const [tracked, mirrored] of [...this.tracking]) {
			if (!blocks.any((b) => b.model === tracked)) {
				for (const [, mirrors] of pairs(mirrored)) {
					for (const mirror of mirrors) {
						mirror.Destroy();
					}
				}

				this.tracking.delete(tracked);
			}
		}

		for (const block of blocks) {
			const mirrored = BuildingManager.getMirroredBlocks(
				plot.BuildingArea.GetPivot(),
				{ id: block.id, pos: block.model.GetPivot() },
				mode,
				this.blockRegistry,
			);

			let tracked = this.tracking.get(block.model);
			if (mirrored.size() === 0) {
				if (tracked) {
					for (const [, mirrors] of pairs(tracked)) {
						for (const mirror of mirrors) {
							mirror.Destroy();
						}
					}

					this.tracking.delete(block.model);
				}

				continue;
			}

			if (!tracked) {
				this.tracking.set(block.model, (tracked = {}));
			}

			const types: Partial<Record<BlockId, number>> = {};
			for (let i = 0; i < mirrored.size(); i++) {
				const mirror = mirrored[i];
				const id = mirror.id;

				types[id] ??= 0;
				const track = (tracked[id] ??= []);
				if (track.size() <= types[id]!) {
					const instance = this.blockRegistry.blocks.get(mirror.id)!.model.Clone();
					BlockGhoster.ghostModel(instance);
					track.push(instance);
				}

				track[types[id]!].PivotTo(mirror.pos);
				types[id]!++;
			}

			for (const mirror of mirrored) {
				const track = (tracked[mirror.id] ??= []);
				const size = track.size();
				for (let i = types[mirror.id] ?? 0; i < size; i++) {
					track.pop()?.Destroy();
				}
			}
		}
	}
	destroyMirrors() {
		if (this.tracking.size() === 0) {
			return;
		}

		for (const [, models] of this.tracking) {
			for (const [, mirrors] of pairs(models)) {
				for (const mirror of mirrors) {
					mirror.Destroy();
				}
			}
		}

		this.tracking.clear();
	}
}
