import { Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import Gui from "client/gui/Gui";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import { SharedPlot } from "shared/building/SharedPlot";

/** An abstract class of tools for working with the world */
export default abstract class ToolBase extends ClientComponent {
	readonly mirrorMode;
	readonly targetPlot;

	protected readonly gameUI;
	protected readonly mouse: Mouse;
	protected readonly mode: BuildingMode;
	protected readonly tooltipHolder: TooltipsHolder;

	constructor(mode: BuildingMode) {
		super();
		this.mode = mode;
		this.mirrorMode = mode.mirrorMode;
		this.targetPlot = mode.targetPlot.asReadonly();

		this.tooltipHolder = this.parent(TooltipsHolder.createComponent(this.getDisplayName()));
		this.tooltipHolder.set(this.getTooltips());

		this.gameUI = Gui.getGameUI<ScreenGui>();
		this.mouse = Players.LocalPlayer.GetMouse();
	}

	subscribeToCurrentPlot(func: (plot: SharedPlot) => void) {
		this.event.subscribeObservable2(
			this.targetPlot,
			(plot) => {
				this.eventHandler.subscribe(plot.changed, () => func(plot));
				func(plot);
			},
			true,
		);
	}

	static getToolGui<TName extends string, TType>(): { readonly [k in TName]: TType } {
		return Gui.getGameUI<{ BuildingMode: { Tools: { [k in TName]: TType } } }>().BuildingMode.Tools;
	}

	supportsMirror() {
		return false;
	}

	/** The name of the tool, for example: `Example Mode` */
	abstract getDisplayName(): string;

	/** Image of the tool*/
	abstract getImageID(): string;

	protected getTooltips(): InputTooltips {
		return {};
	}
}
