import { GuiService, Players, Workspace } from "@rbxts/services";
import Control from "client/base/Control";
import GuiController from "client/controller/GuiController";
import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";
import BuildingManager from "shared/building/BuildingManager";
import SharedPlots from "shared/building/SharedPlots";
import EventHandler from "shared/event/EventHandler";
import PlayerUtils from "shared/utils/PlayerUtils";

export const initializeSingleBlockSelection = (
	eventHandler: EventHandler,
	inputHandler: InputHandler,
	blockHighlighted = (model: Model | undefined) => {},
	submit = (model: Model | undefined) => {},
	filter = (target: Model) => true,
) => {
	const mouse = Players.LocalPlayer.GetMouse();
	let highlight: Highlight | undefined;

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

		if (!filter(target.Parent as Model)) {
			return;
		}

		destroyHighlight();

		highlight = new Instance("Highlight");
		highlight.Parent = target.Parent;
		highlight.Adornee = target.Parent;
		highlight.DepthMode = Enum.HighlightDepthMode.Occluded;

		blockHighlighted(highlight.Parent as Model);
	};

	const prepare = () => {
		const fireSelected = () => submit(highlight?.Parent as Model | undefined);

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

export const initializeBoxSelection = (
	eventHandler: EventHandler,
	onrelease: (blocks: readonly Model[]) => void,
	filter = (block: Model) => true,
) => {
	const camera = Workspace.CurrentCamera!;
	const mouse = Players.LocalPlayer.GetMouse();
	const template = Control.asTemplate(GuiController.getGameUI<{ Selection: GuiObject }>().Selection, false);

	const search = (objects: readonly Model[], p1: Vector2, p2: Vector2) => {
		const to3dSpace = (pos: Vector2) => {
			return camera.ScreenPointToRay(pos.X, pos.Y).Origin;
		};

		const calcSlope = (vec: Vector3) => {
			const rel = camera.CFrame.PointToObjectSpace(vec);
			return new Vector2(rel.X / -rel.Z, rel.Y / -rel.Z);
		};

		const swap = (a1: Vector2, a2: Vector2) => {
			return [
				new Vector2(math.min(a1.X, a2.X), math.min(a1.Y, a2.Y)),
				new Vector2(math.max(a1.X, a2.X), math.max(a1.Y, a2.Y)),
			] as const;
		};

		const overlaps = (cf: CFrame, a1: Vector2, a2: Vector2) => {
			const rel = camera.CFrame.ToObjectSpace(cf);
			const x = rel.X / -rel.Z;
			const y = rel.Y / -rel.Z;

			return a1.X < x && x < a2.X && a1.Y < y && y < a2.Y && rel.Z < 0;
		};

		const search = (objs: readonly Model[], p1: Vector3, p2: Vector3) => {
			let a1 = calcSlope(p1);
			let a2 = calcSlope(p2);
			[a1, a2] = swap(a1, a2);

			return objs.filter((obj) => overlaps(obj.GetBoundingBox()[0], a1, a2));
		};

		return search(objects, to3dSpace(p1), to3dSpace(p2));
	};

	const eh = new EventHandler();
	const highlights: SelectionBox[] = [];
	const clearHighlights = () => {
		for (const highlight of highlights) {
			highlight.Destroy();
		}
		highlights.clear();
	};

	const selectionGui = new Instance("ScreenGui");
	selectionGui.Name = "BoxSelection";
	selectionGui.DisplayOrder = 2;
	selectionGui.Parent = GuiController.getPlayerGui();

	const start = () => {
		if (InputController.inputType.get() === "Desktop") {
			const startpos = new UDim2(0, mouse.X, 0, mouse.Y);

			const selection = template();
			selection.Position = startpos;
			selection.Parent = selectionGui;
			selection.Visible = true;
			selection.Size = new UDim2(0, 0, 0, 0);

			const searchBlocks = () =>
				search(
					SharedPlots.getPlotBlocks(
						SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId),
					).GetChildren() as unknown as readonly Model[],
					new Vector2(startpos.Width.Offset, startpos.Height.Offset),
					new Vector2(mouse.X, mouse.Y),
				).filter(filter);

			eh.subscribe(mouse.Move, () => {
				selection.Size = new UDim2(0, mouse.X, 0, mouse.Y).sub(startpos);

				const inside = searchBlocks();
				clearHighlights();

				for (const block of inside) {
					const highlight = new Instance("SelectionBox");
					highlight.Parent = block;
					highlight.Adornee = block;
					highlight.LineThickness = 0.05;
					highlight.Color3 = Color3.fromRGB(0, 255 / 2, 255);

					highlights.push(highlight);
				}
			});
			eh.subscribeOnce(mouse.Button1Up, () => {
				selection.Destroy();
				eh.unsubscribeAll();
				clearHighlights();

				const inside = searchBlocks();
				if (inside.size() !== 0) {
					onrelease(inside);
				}
			});
		}
	};

	eventHandler.allUnsibscribed.Once(clearHighlights);
	eventHandler.allUnsibscribed.Once(() => eh.unsubscribeAll());
	eventHandler.subscribe(mouse.Button1Down, () => {
		if (InputController.isCtrlPressed()) {
			start();
		}
	});
};
