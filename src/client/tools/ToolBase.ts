import { Players } from "@rbxts/services";
import Gui from "client/gui/Gui";
import BuildingMode from "client/modes/build/BuildingMode";
import ObservableValue from "shared/event/ObservableValue";
import ComponentContainer from "../component/ComponentContainer";

/** An abstract class of tools for working with the world */
export default abstract class ToolBase extends ComponentContainer {
	readonly mirrorMode = new ObservableValue<readonly CFrame[]>([]);

	protected readonly gameUI;
	protected readonly mouse: Mouse;
	protected isEquipped = false;
	protected readonly mode: BuildingMode;

	constructor(mode: BuildingMode) {
		super();
		this.mode = mode;
		this.mirrorMode.bindTo(mode.mirrorMode);

		this.gameUI = Gui.getGameUI<ScreenGui>();
		this.mouse = Players.LocalPlayer.GetMouse();
	}

	public enable() {
		this.isEquipped = true;
		super.enable();
	}

	public disable() {
		this.isEquipped = false;
		super.disable();
	}

	/** The name of the tool, for example: `Example Mode` */
	abstract getDisplayName(): string;

	/** Image of the tool*/
	abstract getImageID(): string;

	/** Description of the tool, for example: `Splits blocks into atoms` */
	abstract getShortDescription(): string;

	public abstract getGamepadTooltips(): readonly { key: Enum.KeyCode; text: string }[];
	public abstract getKeyboardTooltips(): readonly { keys: string[]; text: string }[];
}
