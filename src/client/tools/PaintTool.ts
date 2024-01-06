import ToolBase from "client/base/ToolBase";
import BuildingMode from "client/controller/modes/BuildingMode";
import ObservableValue from "shared/event/ObservableValue";
import PartUtils from "shared/utils/PartUtils";
import { initializeBoxSelection, initializeSingleBlockSelection } from "./MultiBlockSelector";

export default class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));

	constructor(mode: BuildingMode) {
		super(mode);
	}

	paintEverything(plot: Model) {
		for (const block of plot.GetChildren()) {
			if (!block.IsA("Model")) continue;

			this.paintBlock(block);
		}
	}
	paintBlock(block: Model) {
		PartUtils.switchDescendantsMaterial(block, this.selectedMaterial.get());
		PartUtils.switchDescendantsColor(block, this.selectedColor.get());
	}

	protected prepare() {
		super.prepare();

		initializeSingleBlockSelection(
			this.eventHandler,
			this.inputHandler,
			() => {},
			(model) => {
				if (!model) return;
				this.paintBlock(model);
			},
		);
		initializeBoxSelection(this.eventHandler, (blocks) => {
			for (const block of blocks) {
				this.paintBlock(block);
			}
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
