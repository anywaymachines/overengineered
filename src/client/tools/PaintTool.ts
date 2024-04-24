import { Gui } from "client/gui/Gui";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { MultiBlockSelector } from "client/tools/highlighters/MultiBlockSelector";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { ObservableValue } from "shared/event/ObservableValue";

export class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly enableMaterial = new ObservableValue(true);
	readonly enableColor = new ObservableValue(true);

	constructor(mode: BuildingMode) {
		super(mode);

		const fireSelected = async (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;

			await this.paint(blocks);
		};
		const stuff = this.parent(new MultiBlockSelector(mode.targetPlot));
		stuff.submit.Connect(fireSelected);

		this.event.subInput((ih) => {
			ih.onMouse3Down(() => {
				if (Gui.isCursorOnVisibleGui()) return;
				this.pick();
			}, false);
		});
	}

	private pick() {
		const target = this.mouse.Target;
		if (!target) return;

		const block = BlockManager.getBlockDataByPart(target);
		if (!block) return;

		this.selectedMaterial.set(block.material);
		this.selectedColor.set(block.color);
	}

	private paintClientSide(block: BlockModel) {
		SharedBuilding.paint(
			[block],
			this.enableColor.get() ? this.selectedColor.get() : undefined,
			this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
		);
	}

	paintEverything(enableColor?: boolean, enableMaterial?: boolean) {
		return ClientBuilding.paintOperation.execute(
			this.targetPlot.get(),
			"all",
			enableMaterial ?? this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			enableColor ?? this.enableColor.get() ? this.selectedColor.get() : undefined,
		);
	}
	paint(
		blocks: readonly BlockModel[],
		original?: ReadonlyMap<BlockModel, readonly [material: Enum.Material, color: Color3]>,
	) {
		return ClientBuilding.paintOperation.execute(
			this.targetPlot.get(),
			blocks,
			this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			this.enableColor.get() ? this.selectedColor.get() : undefined,
			original,
		);
	}

	getDisplayName(): string {
		return "Paint";
	}
	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895846447";
	}
}
