import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { BlockId } from "shared/BlockDataRegistry";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { BuildingManager } from "shared/building/BuildingManager";
import { Component } from "shared/component/Component";
import { ObservableValue } from "shared/event/ObservableValue";

export class BlockMirrorer extends Component {
	readonly blocks = new ObservableValue<readonly { readonly id: string; readonly model: Model }[]>([]);
	private readonly tracking = new Map<Model, Record<string, Model[]>>();

	constructor() {
		super();
		this.onDisable(() => this.destroyMirrors());
	}

	getMirroredModels(): Readonly<Record<string, readonly Model[]>> {
		const ret: Record<string, Model[]> = {};
		for (const [, track] of this.tracking) {
			for (const [id, models] of pairs(track)) {
				ret[id] ??= [];

				for (const model of models) {
					ret[id].push(model);
				}
			}
		}

		return ret;
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
				plot,
				{ id: block.id, pos: block.model.GetPivot() },
				mode,
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
				const id = mirror.id as BlockId;

				types[id] ??= 0;
				tracked[id] ??= [];
				if (tracked[id].size() <= types[id]!) {
					const instance = BlocksInitializer.blocks.map.get(mirror.id)!.model.Clone();
					BlockGhoster.ghostModel(instance);
					tracked[id].push(instance);
				}

				tracked[id][types[id]!].PivotTo(mirror.pos);
				types[id]!++;
			}

			for (const mirror of mirrored) {
				const track = tracked[mirror.id];
				const size = track.size();
				for (let i = types[mirror.id as BlockId] ?? 0; i < size; i++) {
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
