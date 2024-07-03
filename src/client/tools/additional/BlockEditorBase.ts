import { ClientComponent } from "client/component/ClientComponent";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ClientBuilding } from "client/modes/build/ClientBuilding";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { BB } from "shared/fixes/BB";

type BlockEditInfo = {
	readonly instance: BlockModel;
	readonly origPosition: CFrame;
};

export abstract class BlockEditorBase extends ClientComponent {
	protected readonly plot: SharedPlot;
	protected readonly blocks: readonly BlockModel[];
	protected readonly original: readonly BlockEditInfo[];
	protected readonly plotBounds: BB;

	constructor(
		protected readonly mode: BuildingMode,
		plot: SharedPlot,
		blocks: readonly BlockModel[],
	) {
		super();

		this.plot = plot;
		this.blocks = blocks;
		this.plotBounds = plot.boundsb;
		this.original = blocks.map((p): BlockEditInfo => ({ instance: p, origPosition: p.GetPivot() }));

		const handles = this.initializeHandles();
		this.onDisable(async () => handles.Destroy());
	}

	getUpdate(): ClientBuilding.EditBlockInfo[] {
		return this.original.map(
			(b): ClientBuilding.EditBlockInfo => ({
				...b,
				newPosition: b.instance.GetPivot(),
			}),
		);
	}

	cancel() {
		for (const { instance, origPosition } of this.original) {
			instance.PivotTo(origPosition);
		}
	}

	protected abstract initializeHandles(): Instance;
	protected abstract getTooltips(): InputTooltips;
}
