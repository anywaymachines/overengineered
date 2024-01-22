import { GuiService, Players } from "@rbxts/services";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";
import BlockManager from "shared/building/BlockManager";
import SharedPlots from "shared/building/SharedPlots";
import EventHandler from "shared/event/EventHandler";
import PlayerUtils from "shared/utils/PlayerUtils";

export const initializeSingleBlockSelection = (
	eventHandler: EventHandler,
	inputHandler: InputHandler,
	blockHighlighted = (model: BlockModel | undefined) => {},
	submit = (model: BlockModel | undefined) => {},
	filter = (target: BlockModel) => true,
) => {
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

		if (!filter(target.Parent as BlockModel)) {
			return;
		}

		destroyHighlight();

		highlight = new Instance("Highlight") as Highlight & { Parent: BlockModel };
		highlight.Parent = target.Parent as BlockModel;
		highlight.Adornee = target.Parent;
		highlight.DepthMode = Enum.HighlightDepthMode.Occluded;

		blockHighlighted(highlight.Parent as BlockModel);
	};

	const prepare = () => {
		const fireSelected = () => submit(highlight?.Parent as BlockModel | undefined);

		eventHandler.subscribe(Signals.BLOCKS.BLOCK_ADDED, () => updatePosition());
		eventHandler.subscribe(Signals.BLOCKS.BLOCK_REMOVED, () => updatePosition());

		if (InputController.inputType.get() === "Desktop") {
			eventHandler.subscribe(mouse.Button1Down, () => {
				if (!InputController.isCtrlPressed()) {
					fireSelected();
				}
			});
			eventHandler.subscribe(mouse.Move, () => updatePosition());
		} else if (InputController.inputType.get() === "Gamepad") {
			// gamepad
			inputHandler.onKeyDown(Enum.KeyCode.ButtonX, fireSelected);
			eventHandler.subscribe(Signals.CAMERA.MOVED, () => updatePosition());
		} else if (InputController.inputType.get() === "Touch") {
			// touch
			inputHandler.onTouchTap(() => {
				updatePosition();
				fireSelected();
			});
		}

		updatePosition();
		eventHandler.allUnsibscribed.Once(destroyHighlight);
	};
	prepare();
};
