import { Players, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { InputController } from "client/controller/InputController";
import { Gui } from "client/gui/Gui";
import { SharedPlots } from "shared/building/SharedPlots";
import { ArgsSignal } from "shared/event/Signal";
import type { BlockSelector } from "client/tools/highlighters/MultiBlockSelector";

export class BoxSelector extends ClientComponent implements BlockSelector {
	private readonly _submit = new ArgsSignal<[blocks: readonly BlockModel[]]>();
	readonly submit = this._submit.asReadonly();

	constructor(filter = (block: BlockModel) => true) {
		super();

		const camera = Workspace.CurrentCamera!;
		const mouse = Players.LocalPlayer.GetMouse();
		const template = this.asTemplate(
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

		let selection: GuiObject | undefined;
		const highlights: (SelectionBox & { Parent: BlockModel })[] = [];
		let selected: readonly BlockModel[] | undefined;
		const clearHighlights = () => {
			for (const highlight of highlights) {
				highlight.Destroy();
			}
			highlights.clear();
		};

		if (InputController.inputType.get() === "Desktop") {
			const startpos = new UDim2(0, mouse.X, 0, mouse.Y);

			selection = template();
			selection.Position = startpos;
			selection.Parent = Gui.getUnscaledGameUI();
			selection.Visible = true;
			selection.Size = new UDim2(0, 0, 0, 0);

			const searchBlocks = () =>
				search(
					SharedPlots.getOwnPlot().getBlocks(),
					new Vector2(startpos.Width.Offset, startpos.Height.Offset),
					new Vector2(mouse.X, mouse.Y),
				).filter(filter);

			this.event.subscribe(mouse.Move, () => {
				selection!.Size = new UDim2(0, mouse.X, 0, mouse.Y).sub(startpos);

				const inside = searchBlocks();
				selected = inside;
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
		}

		this.onDisable(() => {
			clearHighlights();
			selection?.Destroy();
		});
		this.onDestroy(() => {
			if (selected && selected.size() !== 0) {
				this._submit.Fire(selected);
			}
		});
	}
}
