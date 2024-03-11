import { GuiService, Players } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import Gui from "client/gui/Gui";
import { SharedPlot } from "shared/building/SharedPlot";
import ObservableValue from "shared/event/ObservableValue";
import PlayerUtils from "shared/utils/PlayerUtils";

export default class HoveredPartHighlighter<T extends Instance> extends ClientComponent {
	readonly highlightedPart = new ObservableValue<T | undefined>(undefined);

	constructor(map?: (part: BasePart) => T | undefined) {
		super();

		const mouse = Players.LocalPlayer.GetMouse();
		let selectionBox: (SelectionBox & { Parent: T }) | undefined;

		const destroyHighlight = () => {
			selectionBox?.Destroy();
			selectionBox = undefined;

			this.highlightedPart.set(undefined);
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
			if (Gui.isCursorOnVisibleGui()) {
				destroyHighlight();
				return;
			}

			let target: Instance | undefined = mouse.Target;

			// if the same target
			if (target === selectionBox?.Parent) {
				return;
			}

			destroyHighlight();

			if (target) {
				target = map?.(target as BasePart);
			}

			if (!target) return;

			destroyHighlight();

			selectionBox = new Instance("SelectionBox") as typeof selectionBox & defined;
			selectionBox.Parent = target as T;
			selectionBox.Adornee = target;
			selectionBox.SurfaceTransparency = 0.95;
			selectionBox.LineThickness = 0.1;
			selectionBox.Color3 = new Color3(1, 1, 1);
			selectionBox.SurfaceColor3 = new Color3(1, 1, 1);
			selectionBox.Transparency = 0;

			this.highlightedPart.set(selectionBox.Parent);
		};

		const prepare = () => {
			this.eventHandler.subscribe(SharedPlot.anyChanged, updatePosition);

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
		this.event.onDisable(destroyHighlight);
	}
}
