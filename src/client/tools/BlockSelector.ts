import { GuiService, Players, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import EventHandler from "shared/event/EventHandler";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class BlockSelector {
	public readonly blockHighlighted = new Signal<(part: Model | undefined) => void>();
	public readonly blockSelected = new Signal<(part: Model | undefined) => void>();

	private readonly mouse;
	private readonly eventHandler;
	private readonly inputHandler;
	private readonly filter;
	private highlight?: Highlight;

	constructor(
		eventHandler: EventHandler,
		inputHandler: InputHandler,
		filter: (target: BasePart & { Parent: Instance }) => boolean = () => true,
	) {
		this.eventHandler = eventHandler;
		this.inputHandler = inputHandler;
		this.mouse = Players.LocalPlayer.GetMouse();
		this.filter = filter;
	}

	public prepare() {
		const fireSelected = () => this.blockSelected.Fire(this.highlight?.Parent as Model | undefined);

		this.eventHandler.subscribe(Signals.BLOCKS.ADDED, () => this.updatePosition());
		this.eventHandler.subscribe(Signals.BLOCKS.REMOVED, () => this.updatePosition());

		if (Signals.INPUT_TYPE.get() === "Desktop") {
			this.eventHandler.subscribe(this.mouse.Button1Down, () => {
				if (!InputController.isCtrlPressed()) {
					fireSelected();
				}
			});
			this.eventHandler.subscribe(this.mouse.Move, () => this.updatePosition());
		} else if (Signals.INPUT_TYPE.get() === "Gamepad") {
			// gamepad
			this.inputHandler.onKeyDown(Enum.KeyCode.ButtonX, fireSelected);
			this.eventHandler.subscribe(Signals.CAMERA.MOVED, () => this.updatePosition());
		} else if (Signals.INPUT_TYPE.get() === "Touch") {
			// touch
			this.inputHandler.onTouchTap(() => {
				this.updatePosition();
				fireSelected();
			});
		}
		this.updatePosition();
	}
	public deactivate() {
		this.destroyHighlight();
	}

	public getHighlightedBlock() {
		return this.highlight?.Parent as Model | undefined;
	}

	private updatePosition() {
		// ignore if ESC menu is open
		if (GuiService.MenuIsOpen) {
			return;
		}

		// ignore if not alivec
		if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
			return;
		}

		// ignore if over a GUI element
		if (GuiController.isCursorOnVisibleGui()) {
			return;
		}

		const target = this.mouse.Target;

		// if the same target
		if (target === this.highlight?.Parent) {
			return;
		}

		this.destroyHighlight();

		// if no target
		if (!target) {
			return;
		}

		// if target invalid
		if (!target.Parent || !target.IsDescendantOf(Workspace.Plots)) {
			return;
		}

		const parentPlot = SharedPlots.getPlotByBlock(target.Parent as Model);

		// if no plot
		if (!parentPlot) {
			return;
		}

		// wrong plot
		if (!BuildingManager.isBuildingAllowed(parentPlot, Players.LocalPlayer)) {
			return;
		}

		if (!this.filter(target as BasePart & { Parent: Instance })) {
			return;
		}

		this.createHighlight(target);
	}

	private createHighlight(target: BasePart) {
		this.destroyHighlight();

		this.highlight = new Instance("Highlight");
		this.highlight.Parent = target.Parent;
		this.highlight.Adornee = target.Parent;

		this.blockHighlighted.Fire(this.highlight.Parent as Model);
	}

	private destroyHighlight() {
		this.highlight?.Destroy();
		this.highlight = undefined;

		this.blockHighlighted.Fire(undefined);
	}
}
