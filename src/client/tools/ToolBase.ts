import { Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import Gui from "client/gui/Gui";
import type { TooltipSource } from "client/gui/static/TooltipsControl";
import TooltipsControl from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import ObservableValue from "shared/event/ObservableValue";

/** An abstract class of tools for working with the world */
export default abstract class ToolBase extends ClientComponent implements TooltipSource {
	readonly mirrorMode = new ObservableValue<MirrorMode>({});

	protected readonly gameUI;
	protected readonly mouse: Mouse;
	protected readonly mode: BuildingMode;

	constructor(mode: BuildingMode) {
		super();
		this.mode = mode;
		this.mirrorMode.bindTo(mode.mirrorMode);

		this.gameUI = Gui.getGameUI<ScreenGui>();
		this.mouse = Players.LocalPlayer.GetMouse();
	}

	protected getTooltipsSource(): TooltipSource | undefined {
		return this.isEnabled() ? this : undefined;
	}
	protected updateTooltips() {
		TooltipsControl.instance.updateControlTooltips(this.getTooltipsSource());
	}

	static getToolGui<TName extends string, TType>(): { readonly [k in TName]: TType } {
		return Gui.getGameUI<{ BuildingMode: { Tools: { [k in TName]: TType } } }>().BuildingMode.Tools;
	}

	enable() {
		super.enable();
		this.updateTooltips();
	}

	disable() {
		super.disable();
		this.updateTooltips();
	}

	/** The name of the tool, for example: `Example Mode` */
	abstract getDisplayName(): string;

	/** Image of the tool*/
	abstract getImageID(): string;

	abstract getGamepadTooltips(): readonly { key: Enum.KeyCode; text: string }[];
	abstract getKeyboardTooltips(): readonly { keys: string[]; text: string }[];
}
