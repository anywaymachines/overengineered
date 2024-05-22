import { Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { Gui } from "client/gui/Gui";
import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { ComponentEvents } from "shared/component/ComponentEvents";

/** An abstract class of tools for working with the world */
export abstract class ToolBase extends ClientComponent {
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

	subscribeSomethingToCurrentPlot(
		state: IComponent & { readonly event: ComponentEvents },
		func: (plot: SharedPlot) => void,
	) {
		state.event.subscribeObservable(
			this.targetPlot,
			(plot) => {
				state.event.eventHandler.subscribe(plot.changed, () => func(plot));
				func(plot);
			},
			true,
		);
	}
	protected subscribeToCurrentPlot(func: (plot: SharedPlot) => void) {
		this.subscribeSomethingToCurrentPlot(this, func);
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
