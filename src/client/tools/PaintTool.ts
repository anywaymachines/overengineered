import Gui from "client/gui/Gui";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import BoxSelector from "client/tools/selectors/BoxSelector";
import HoveredBlockHighlighter from "client/tools/selectors/HoveredBlockHighlighter";
import MovingSelector from "client/tools/selectors/MovingSelector";
import Remotes from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import ObservableValue from "shared/event/ObservableValue";

export default class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly enableMaterial = new ObservableValue(true);
	readonly enableColor = new ObservableValue(true);

	constructor(mode: BuildingMode) {
		super(mode);

		const hoverHighlighter = this.parent(new HoveredBlockHighlighter((b) => this.targetPlot.get().hasBlock(b)));
		this.onPrepare((inputType) => {
			if (inputType === "Desktop") {
				hoverHighlighter.enable();
			} else {
				hoverHighlighter.disable();
			}
		});

		{
			const selected = new Set<BlockModel>();

			this.parent(
				new MovingSelector(
					(part) => {
						const block = BlockManager.getBlockDataByPart(part);
						if (!block) return;

						this.paintClientSide(block.instance);
						selected.add(block.instance);
					},
					() => {
						if (selected.size() === 0) return;

						this.paint(SharedPlots.getPlotByBlock([...selected][0])!, [...selected]);
						selected.clear();
					},
				),
			);
		}

		const boxSelector = this.parent(new BoxSelector());
		this.event.subscribe(
			boxSelector.submitted,
			async (blocks) => await this.paint(SharedPlots.getPlotByBlock(blocks[0])!, blocks),
		);

		this.event.onInputBegin(async (input) => {
			if (Gui.isCursorOnVisibleGui()) return;
			if (input.UserInputType !== Enum.UserInputType.MouseButton3) return;
			this.pick();
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

	async paintClientSide(block: BlockModel) {
		SharedBuilding.paint(
			[block],
			this.enableColor.get() ? this.selectedColor.get() : undefined,
			this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
		);
	}

	async paintEverything(plot: PlotModel, enableColor?: boolean, enableMaterial?: boolean) {
		await Remotes.Client.GetNamespace("Building")
			.Get("PaintBlocks")
			.CallServerAsync({
				plot,
				blocks: "all",
				color: enableColor ?? this.enableColor.get() ? this.selectedColor.get() : undefined,
				material: enableMaterial ?? this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			});
	}
	async paint(plot: PlotModel, blocks: readonly BlockModel[]) {
		await Remotes.Client.GetNamespace("Building")
			.Get("PaintBlocks")
			.CallServerAsync({
				plot,
				blocks,
				color: this.enableColor.get() ? this.selectedColor.get() : undefined,
				material: this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			});
	}

	getDisplayName(): string {
		return "Paint";
	}
	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895846447";
	}
}
