import { GuiService, Players } from "@rbxts/services";
import ComponentBase from "client/base/ComponentBase";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import BlockManager from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class HoveredBlockHighlighter extends ComponentBase {
	constructor(blockHighlighted = (block: BlockModel | undefined) => {}, filter = (block: BlockModel) => true) {
		super();

		const mouse = Players.LocalPlayer.GetMouse();
		let highlight: (Highlight & { Parent: BlockModel }) | undefined;

		const destroyHighlight = () => {
			highlight?.Destroy();
			highlight = undefined;

			blockHighlighted(undefined);
		};

		const updatePosition = () => {
			// ignore if ESC menu is open
			if (GuiService.MenuIsOpen) {
				return;
			}

			// ignore if not alive
			if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
				return;
			}

			// ignore if over a GUI element
			if (GuiController.isCursorOnVisibleGui()) {
				destroyHighlight();
				return;
			}

			const target = mouse.Target;

			// if the same target
			if (target === highlight?.Parent) {
				return;
			}

			destroyHighlight();

			// if no target
			if (!target) {
				return;
			}

			// if target invalid
			if (!target.Parent || !BlockManager.isBlockPart(target)) {
				return;
			}

			const parentPlot = SharedPlots.getPlotByBlock(target.Parent);

			// if no plot
			if (!parentPlot) {
				return;
			}

			// wrong plot
			if (!SharedPlots.isBuildingAllowed(parentPlot, Players.LocalPlayer)) {
				return;
			}

			if (!filter(target.Parent)) {
				return;
			}

			destroyHighlight();

			highlight = new Instance("Highlight") as typeof highlight & defined;
			highlight.Parent = target.Parent as BlockModel;
			highlight.Adornee = target.Parent;
			highlight.DepthMode = Enum.HighlightDepthMode.Occluded;

			blockHighlighted(highlight.Parent as BlockModel);
		};

		const prepare = () => {
			this.eventHandler.subscribe(Signals.BLOCKS.BLOCK_ADDED, updatePosition);
			this.eventHandler.subscribe(Signals.BLOCKS.BLOCK_REMOVED, updatePosition);

			if (InputController.inputType.get() === "Desktop") {
				this.eventHandler.subscribe(mouse.Move, updatePosition);
				this.eventHandler.subscribe(Signals.CAMERA.MOVED, updatePosition);
			} else if (InputController.inputType.get() === "Gamepad") {
				this.eventHandler.subscribe(Signals.CAMERA.MOVED, updatePosition);
			} else if (InputController.inputType.get() === "Touch") {
				this.inputHandler.onTouchTap(updatePosition);
			}

			updatePosition();
		};

		this.event.onPrepare(prepare);
		this.onDisabled.Connect(destroyHighlight);
	}
}
