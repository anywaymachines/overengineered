import ToolBase from "client/base/ToolBase";
import BuildingMode from "client/controller/modes/BuildingMode";
import Remotes from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import ObservableValue from "shared/event/ObservableValue";
import { initializeBoxSelection } from "./selectors/BoxSelector";
import HoveredBlockHighlighter from "./selectors/HoveredBlockHighlighter";
import MovingSelector from "./selectors/MovingSelector";

export default class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly enableMaterial = new ObservableValue(true);
	readonly enableColor = new ObservableValue(true);

	constructor(mode: BuildingMode) {
		super(mode);

		this.add(new HoveredBlockHighlighter((block) => {}));

		{
			const selected = new Set<BlockModel>();

			this.add(
				new MovingSelector(
					(part) => {
						const block = BlockManager.getBlockDataByPart(part);
						if (!block) return;

						this.paintClientSide(block.instance);
						selected.add(block.instance);
					},
					() => {
						this.paint([...selected]);
						selected.clear();
					},
				),
			);
		}
	}

	async paintClientSide(block: BlockModel) {
		SharedBuilding.paint({
			blocks: [block],
			material: this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			color: this.enableColor.get() ? this.selectedColor.get() : undefined,
		});
	}

	async paintEverything(plot: PlotModel) {
		await Remotes.Client.GetNamespace("Building")
			.Get("Paint")
			.CallServerAsync({
				plot,
				color: this.enableColor.get() ? this.selectedColor.get() : undefined,
				material: this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			});
	}
	async paint(blocks: readonly BlockModel[]) {
		await Remotes.Client.GetNamespace("Building")
			.Get("Paint")
			.CallServerAsync({
				blocks,
				color: this.enableColor.get() ? this.selectedColor.get() : undefined,
				material: this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			});
	}

	protected prepare() {
		super.prepare();

		initializeBoxSelection(this.eventHandler, (blocks) => {
			this.paint(blocks);
		});
	}

	getDisplayName(): string {
		return "Paint Mode";
	}
	getShortDescription(): string {
		return "Paint your build";
	}
	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895846447";
	}

	public getGamepadTooltips(): readonly { key: Enum.KeyCode; text: string }[] {
		return [];
	}
	public getKeyboardTooltips(): readonly { keys: string[]; text: string }[] {
		return [];
	}
}
