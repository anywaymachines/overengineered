import { ReplicatedStorage } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { ClientComponentBase } from "client/component/ClientComponentBase";
import InputController from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import Gui from "client/gui/Gui";
import LogControl from "client/gui/static/LogControl";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import Remotes from "shared/Remotes";
import { SharedBuilding } from "shared/building/SharedBuilding";
import SharedPlots from "shared/building/SharedPlots";
import { ComponentChild } from "shared/component/ComponentChild";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";
import { AABB } from "shared/fixes/AABB";
import HoveredBlockHighlighter from "./selectors/HoveredBlockHighlighter";

const { isFullPlot, isBlocks, isEmpty, getBlockList } = SharedBuilding;

namespace Selectors {
	export class DesktopMultiSelector extends ClientComponentBase {
		readonly selectedBlocksChanged = new Signal<(blocks: readonly BlockModel[]) => void>();
		private readonly selections: (SelectionBox & { readonly Parent: BlockModel })[] = [];
		private readonly selected: BlockModel[] = [];

		constructor() {
			super();
			const highlighter = this.parent(new HoveredBlockHighlighter());

			this.event.subInput((ih) =>
				ih.onMouse1Down(() => {
					this.selectBlockByClick(highlighter.highlightedBlock.get());
				}),
			);

			this.onDestroy(() => {
				for (const selection of this.selections) {
					selection.Destroy();
				}

				this.selections.clear();
				this.selected.clear();
			});
		}

		private selectBlock(block: BlockModel) {
			const instance = new Instance("SelectionBox") as SelectionBox & { Parent: BlockModel };
			instance.Parent = block;
			instance.Adornee = block;
			instance.LineThickness = 0.05;
			instance.Color3 = Color3.fromRGB(0, 255 / 2, 255);

			this.selections.push(instance);
			this.selected.push(block);
			this.selectedBlocksChanged.Fire(this.selected);
		}
		private selectBlockByClick(block: BlockModel | undefined) {
			const pc = InputController.inputType.get() === "Desktop";
			const add = InputController.inputType.get() === "Gamepad" || InputController.isShiftPressed();

			if (pc && !add) {
				for (const sel of this.selections) {
					sel.Destroy();
				}

				this.selections.clear();
				this.selected.clear();

				if (!block) {
					this.selectedBlocksChanged.Fire(this.selected);
				}
			}

			if (!block) {
				if (!pc) LogControl.instance.addLine("Block is not targeted!");
				return;
			}

			const removeOrAddHighlight = () => {
				const existing = this.selections.findIndex((sel) => sel.Parent === block);
				if (existing !== -1) {
					this.selections[existing].Destroy();
					this.selections.remove(existing);

					this.selected.remove(this.selected.indexOf(block));
					this.selectedBlocksChanged.Fire(this.selected);
				} else {
					this.selectBlock(block);
				}
			};

			if (pc) removeOrAddHighlight();
			else {
				if (add) this.selectBlock(block);
				else removeOrAddHighlight();
			}
		}
	}
}

namespace Controllers {
	export interface IController extends IComponent {}

	export class Move extends ClientComponentBase implements IController {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

		private readonly plot: PlotModel;
		private readonly blocks: BlockList;
		private readonly moveHandles: MoveHandles;
		private readonly plotBounds: AABB;

		constructor(plot: PlotModel, blocks: BlockList) {
			super();

			this.plot = plot;
			this.blocks = blocks;
			this.plotBounds = SharedPlots.getPlotBuildingRegion(plot);

			this.moveHandles = this.initializeHandles();
			this.onDestroy(() => this.moveHandles.Destroy());
		}

		private initializeHandles() {
			const roundByStep = (number: number) => {
				const step = this.step.get();
				return number - (((number + step / 2) % step) - step / 2);
			};

			const initHandles = (instance: Handles, blocks: BlockList) => {
				let startpos = Vector3.zero;
				let pivots: (readonly [BlockModel, CFrame])[] = [];
				let difference: Vector3 = Vector3.zero;

				const limitMovement = (
					regionSize: Vector3,
					regionPos: Vector3,
					direction: Vector3,
					distance: number,
					bounds: AABB,
				): number => {
					const axes = direction.X !== 0 ? "X" : direction.Y !== 0 ? "Y" : "Z";
					const sign = math.sign(direction[axes]);

					const blockOffsetMin = regionPos[axes] - regionSize[axes] / 2;
					const blockOffsetMax = regionPos[axes] + regionSize[axes] / 2;
					let boundsmin = (bounds.getMin()[axes] - blockOffsetMin) * sign;
					let boundsmax = (bounds.getMax()[axes] - blockOffsetMax) * sign;
					[boundsmin, boundsmax] = [math.min(boundsmin, boundsmax), math.max(boundsmin, boundsmax)];

					return math.clamp(distance, boundsmin, boundsmax);
				};

				this.event.subscribe(instance.MouseButton1Down, () => {
					startpos = moveHandles.GetPivot().Position;
					pivots = getBlockList(blocks).map((p) => [p, p.GetPivot()] as const);
				});
				this.event.subscribe(instance.MouseButton1Up, async () => {
					if (moveHandles.GetPivot().Position === startpos) return;

					const success = await this.submit(difference);
					if (!success) {
						moveHandles.PivotTo(new CFrame(startpos));
						for (const [block, startpos] of pivots) {
							block.PivotTo(startpos);
						}
					}

					pivots.clear();
				});

				this.event.subscribe(instance.MouseDrag, (face, distance) => {
					distance = limitMovement(
						aabb.getSize(),
						startpos,
						Vector3.FromNormalId(face),
						distance,
						this.plotBounds,
					);
					distance = roundByStep(distance);
					difference = Vector3.FromNormalId(face).mul(distance);

					if (!this.plotBounds.contains(aabb.withCenter(startpos.add(difference)))) {
						return;
					}

					moveHandles.PivotTo(new CFrame(startpos.add(difference)));
					for (const [block, startpos] of pivots) {
						block.PivotTo(startpos.add(difference));
					}
				});
			};

			const aabb = isFullPlot(this.blocks) ? AABB.fromModel(this.blocks) : AABB.fromModels(this.blocks);

			const moveHandles = ReplicatedStorage.Assets.MoveHandles.Clone();
			moveHandles.Size = aabb.getSize().add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
			moveHandles.PivotTo(new CFrame(aabb.getCenter()));
			moveHandles.Parent = Gui.getPlayerGui();

			initHandles(moveHandles.XHandles, this.blocks);
			initHandles(moveHandles.YHandles, this.blocks);
			initHandles(moveHandles.ZHandles, this.blocks);

			return moveHandles;
		}

		private async submit(diff: Vector3): Promise<boolean> {
			const response = await Remotes.Client.GetNamespace("Building").Get("MoveBlocks").CallServerAsync({
				plot: this.plot,
				blocks: this.blocks,
				diff,
			});

			if (!response.success) {
				LogControl.instance.addLine(response.message, Colors.red);
			}

			return response.success;
		}
	}
}

export default class EditTool extends ToolBase {
	private readonly controller = new ComponentChild<Controllers.IController>(this, true);
	private readonly selected = new ObservableValue<BlockList>([]);

	constructor(mode: BuildingMode) {
		super(mode);

		{
			const selector = this.parent(new Selectors.DesktopMultiSelector());
			this.event.subscribe(selector.selectedBlocksChanged, (selected) => this.selected.set(selected, true));

			this.controller.childSet.Connect((child) => {
				if (child) {
					selector.disable();
				} else {
					selector.enable();
				}
			});
		}

		this.event.onKeyDown("F", () => {
			if (this.controller.get() instanceof Controllers.Move) {
				this.controller.clear();
			} else {
				this.enterMoveMode();
			}
		});
	}

	enterMoveMode() {
		const selected = this.selected.get();
		if (isEmpty(selected)) {
			return;
		}

		const plot = isFullPlot(selected) ? selected : SharedPlots.getPlotByBlock(selected[0])!;
		this.controller.set(new Controllers.Move(plot, selected));
	}

	getDisplayName(): string {
		return "Edit (DEV TEST)";
	}

	getImageID(): string {
		return "rbxassetid://12539306575";
	}

	public getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		return [];
	}
	public getKeyboardTooltips(): readonly { readonly keys: KeyCode[]; readonly text: string }[] {
		return [{ keys: ["F"], text: "Move" }];
	}
}
