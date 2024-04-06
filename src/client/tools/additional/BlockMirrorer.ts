import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { BuildingManager } from "shared/building/BuildingManager";
import { Component } from "shared/component/Component";
import { ObservableValue } from "shared/event/ObservableValue";

export class BlockMirrorer extends Component {
	readonly blocks = new ObservableValue<readonly { readonly id: string; readonly model: Model }[]>([]);
	private readonly tracking = new Map<Model, Model[]>();

	constructor() {
		super();
		this.onDisable(() => this.destroyMirrors());
	}

	getMirroredModels(): ReadonlyMap<Model, readonly Model[]> {
		return this.tracking;
	}

	updatePositions(plot: PlotModel, mode: MirrorMode) {
		const blocks = this.blocks.get();

		for (const [tracked, mirrored] of [...this.tracking]) {
			if (!blocks.any((b) => b.model === tracked)) {
				for (const mirror of mirrored) {
					mirror.Destroy();
				}

				this.tracking.delete(tracked);
			}
		}

		for (const block of blocks) {
			const mirrored = BuildingManager.getMirroredBlocksCFrames(plot, block.id, block.model.GetPivot(), mode);

			let tracked = this.tracking.get(block.model);
			if (!tracked || tracked.size() !== mirrored.size()) {
				if (tracked) {
					for (const model of tracked) {
						model.Destroy();
					}
				}

				tracked = [];
				this.tracking.set(block.model, tracked);

				for (const _ of mirrored) {
					const instance = block.model.Clone();
					BlockGhoster.ghostModel(instance);

					tracked.push(instance);
				}
			}

			mirrored.forEach((mirror, i) => tracked![i].PivotTo(mirror));
		}
	}
	destroyMirrors() {
		if (this.tracking.size() === 0) {
			return;
		}

		for (const [, models] of this.tracking) {
			for (const model of models) {
				model.Destroy();
			}
		}

		this.tracking.clear();
	}
}
