import { Players, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import SharedPlots from "shared/building/SharedPlots";
import EventHandler from "shared/event/EventHandler";

export default class BoxSelector extends ClientComponent {
	readonly submitted = new Signal<(blocks: readonly BlockModel[]) => void>();

	constructor(filter = (block: BlockModel) => true) {
		super();

		const camera = Workspace.CurrentCamera!;
		const mouse = Players.LocalPlayer.GetMouse();
		const template = Control.asTemplate(
			Gui.getGameUI<{ Templates: { Selection: GuiObject } }>().Templates.Selection,
			false,
		);

		const search = (objects: readonly BlockModel[], p1: Vector2, p2: Vector2) => {
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

			const search = (objs: readonly BlockModel[], p1: Vector3, p2: Vector3) => {
				let a1 = calcSlope(p1);
				let a2 = calcSlope(p2);
				[a1, a2] = swap(a1, a2);

				return objs.filter((obj) => overlaps(obj.GetBoundingBox()[0], a1, a2));
			};

			return search(objects, to3dSpace(p1), to3dSpace(p2));
		};

		const eh = new EventHandler();
		let selection: GuiObject | undefined;
		const highlights: (SelectionBox & { Parent: BlockModel })[] = [];
		const clearHighlights = () => {
			for (const highlight of highlights) {
				highlight.Destroy();
			}
			highlights.clear();
		};

		const start = () => {
			if (InputController.inputType.get() === "Desktop") {
				const startpos = new UDim2(0, mouse.X, 0, mouse.Y);

				selection = template();
				selection.Position = startpos;
				selection.Parent = Gui.getUnscaledGameUI();
				selection.Visible = true;
				selection.Size = new UDim2(0, 0, 0, 0);

				const searchBlocks = () =>
					search(
						SharedPlots.getPlotBlocks(SharedPlots.getPlotByOwnerID(Players.LocalPlayer.UserId)).GetChildren(
							undefined,
						),
						new Vector2(startpos.Width.Offset, startpos.Height.Offset),
						new Vector2(mouse.X, mouse.Y),
					).filter(filter);

				eh.subscribe(mouse.Move, () => {
					selection!.Size = new UDim2(0, mouse.X, 0, mouse.Y).sub(startpos);

					const inside = searchBlocks();
					clearHighlights();

					for (const block of inside) {
						const highlight = new Instance("SelectionBox") as SelectionBox & { Parent: BlockModel };
						highlight.Parent = block;
						highlight.Adornee = block;
						highlight.LineThickness = 0.05;
						highlight.Color3 = Color3.fromRGB(0, 255 / 2, 255);

						highlights.push(highlight);
					}
				});
				eh.subscribeOnce(mouse.Button1Up, () => {
					selection?.Destroy();
					eh.unsubscribeAll();
					clearHighlights();

					const inside = searchBlocks();
					if (inside.size() !== 0) {
						this.submitted.Fire(inside);
					}
				});
			}
		};

		this.event.onDisable(() => {
			clearHighlights();
			selection?.Destroy();
			eh.unsubscribeAll();
		});
		this.event.subscribe(mouse.Button1Down, () => {
			if (InputController.isCtrlPressed()) {
				start();
			}
		});
	}
}
