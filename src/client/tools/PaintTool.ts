import ToolBase from "client/base/ToolBase";
import BuildingMode from "client/controller/modes/BuildingMode";
import Remotes from "shared/Remotes";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";
import { initializeBoxSelection, initializeSingleBlockSelection } from "./MultiBlockSelector";

export default class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));

	constructor(mode: BuildingMode) {
		super(mode);
	}

	async paintClientSide(block: BlockModel) {
		PartUtils.switchDescendantsMaterial(block, this.selectedMaterial.get());
		PartUtils.switchDescendantsColor(block, this.selectedColor.get());
	}

	async paintEverything(plot: PlotModel) {
		await Remotes.Client.GetNamespace("Building").Get("Paint").CallServerAsync({
			plot,
			color: this.selectedColor.get(),
			material: this.selectedMaterial.get(),
		});
	}
	async paint(blocks: readonly BlockModel[]) {
		await Remotes.Client.GetNamespace("Building").Get("Paint").CallServerAsync({
			blocks,
			color: this.selectedColor.get(),
			material: this.selectedMaterial.get(),
		});
	}

	protected prepare() {
		super.prepare();

		initializeSingleBlockSelection(
			this.eventHandler,
			this.inputHandler,
			() => {},
			(model) => {
				if (!model) return;
				this.paint([model]);
			},
		);
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
