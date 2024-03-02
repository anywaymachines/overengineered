import { Players, ReplicatedStorage } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import Gui from "client/gui/Gui";
import LogControl from "client/gui/static/LogControl";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import { Element } from "shared/Element";
import Remotes from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { SharedPlot } from "shared/building/SharedPlot";
import SharedPlots from "shared/building/SharedPlots";
import { ComponentChild } from "shared/component/ComponentChild";
import NumberObservableValue from "shared/event/NumberObservableValue";
import ObservableValue from "shared/event/ObservableValue";
import { AABB } from "shared/fixes/AABB";
import { Arrays } from "shared/fixes/Arrays";
import HoveredBlockHighlighter from "./selectors/HoveredBlockHighlighter";
import { MultiModelHighlighter } from "./selectors/MultiModelHighlighter";

const { isFullPlot, isBlocks, isEmpty, getBlockList } = SharedBuilding;

namespace Selectors {
	class HoveredBlocksHighlighter extends ClientComponent {
		private readonly _highlighted = new ObservableValue<readonly BlockModel[]>([]);
		readonly highlighted = this._highlighted.asReadonly();

		constructor(parent: Instance, getTargets: (block: BlockModel) => readonly BlockModel[]) {
			super();

			const highlighter = this.parent(new MultiModelHighlighter(parent));
			const mouse = Players.LocalPlayer.GetMouse();
			let prevTarget: Instance | undefined;

			const destroyHighlight = () => {
				prevTarget = undefined;
				highlighter.stop();
				this._highlighted.set([]);
			};

			/** @param forceUpdate If true, don't check for `target === prevTarget`. Useful for updating on pressing Ctrl, since the targeted block did not change but the update is nesessary */
			const updateTarget = (forceUpdate: boolean) => {
				const target = HoveredBlockHighlighter.getTargetedBlock(mouse);
				if (!target) {
					destroyHighlight();
					return;
				}

				if (!forceUpdate && target === prevTarget) {
					return;
				}
				prevTarget = target;

				const targets = getTargets(target);
				highlighter.highlight(targets);
				this._highlighted.set(targets);
			};

			const prepare = () => {
				this.eventHandler.subscribe(Signals.BLOCKS.BLOCK_ADDED, () => updateTarget(false));
				this.eventHandler.subscribe(Signals.BLOCKS.BLOCK_REMOVED, () => updateTarget(false));
				this.inputHandler.onInputBegan(() => updateTarget(true));
				this.inputHandler.onInputChanged(() => updateTarget(false));
				this.inputHandler.onInputEnded(() => updateTarget(true));

				updateTarget(true);
			};

			this.onEnable(prepare);
			this.onDisable(destroyHighlight);
		}
	}

	export class DesktopMultiSelector extends ClientComponent {
		readonly selectedBlocksChanged = new Signal<(blocks: readonly BlockModel[]) => void>();
		private readonly selected = new Map<BlockModel, SelectionBox>();

		constructor(plot: SharedPlot) {
			super();
			const highlighter = this.parent(
				new HoveredBlocksHighlighter(plot.instance.Blocks, (block) => {
					if (InputController.isCtrlPressed()) {
						return this.getConnected(block);
					}

					return [block];
				}),
			);

			this.event.subInput((ih) => {
				ih.onMouse1Down(() => this.selectBlocksByClick(highlighter.highlighted.get()), false);
				ih.onTouchTap(() => this.selectBlocksByClick(highlighter.highlighted.get()));
			});

			this.onDestroy(() => {
				for (const [, selection] of this.selected) {
					selection.Destroy();
				}
				this.selected.clear();
				this.selectedBlocksChanged.Fire(Arrays.empty);
			});
		}

		private getConnected(block: BlockModel) {
			// using set to prevent duplicates
			return [
				...new Set(
					block.PrimaryPart!.GetConnectedParts(true).map((b) => BlockManager.getBlockDataByPart(b)!.instance),
				),
			];
		}

		/** @returns A boolean indicating whether the block was successfully selected */
		private selectBlock(block: BlockModel): boolean {
			if (this.selected.has(block)) {
				return false;
			}

			const instance = Element.create("SelectionBox", {
				LineThickness: 0.05,
				Color3: Color3.fromRGB(0, 255 / 2, 255),
				Adornee: block,
				Parent: block,
			});

			this.selected.set(block, instance);
			this.selectedBlocksChanged.Fire(Arrays.ofMap.keys(this.selected));
			return true;
		}
		/** @returns A boolean indicating whether the block was successfully deselected */
		private deselectBlock(block: BlockModel): boolean {
			const existing = this.selected.get(block);
			if (!existing) return false;

			existing.Destroy();
			this.selected.delete(block);
			return true;
		}

		private selectBlocksByClick(blocks: readonly BlockModel[]) {
			const pc = InputController.inputType.get() === "Desktop";
			const add = InputController.inputType.get() === "Gamepad" || InputController.isShiftPressed();
			const selectConnected = pc && InputController.isCtrlPressed();

			if (pc && !add) {
				for (const [, selection] of this.selected) {
					selection.Destroy();
				}
				this.selected.clear();

				if (blocks.size() === 0) {
					this.selectedBlocksChanged.Fire(Arrays.ofMap.keys(this.selected));
				}
			}

			if (blocks.size() === 0) {
				if (!pc) LogControl.instance.addLine("Block is not targeted!");
				return;
			}

			const toggleBlocksSelection = () => {
				for (const block of blocks) {
					if (this.deselectBlock(block)) {
						continue;
					}

					this.selectBlock(block);
				}
			};

			if (pc) {
				if (selectConnected) {
					const allBlocksAlreadySelected = Arrays.all(blocks, (b) => this.selected.has(b));
					if (!allBlocksAlreadySelected) {
						for (const block of blocks) {
							this.selectBlock(block);
						}
					} else {
						toggleBlocksSelection();
					}
				} else {
					toggleBlocksSelection();
				}
			} else {
				if (add) {
					for (const block of blocks) {
						this.selectBlock(block);
					}
				} else {
					toggleBlocksSelection();
				}
			}
		}
	}
}

namespace Controllers {
	export interface IController extends IComponent {}

	export class Move extends ClientComponent implements IController {
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

export type EditToolMode = "Move";
export default class EditTool extends ToolBase {
	private readonly _selectedMode = new ObservableValue<EditToolMode | undefined>(undefined);
	readonly selectedMode = this._selectedMode.asReadonly();
	private readonly _selected = new ObservableValue<BlockList>(Arrays.empty);
	readonly selected = this._selected.asReadonly();
	private readonly controller = new ComponentChild<Controllers.IController>(this, true);
	private readonly plot = new ObservableValue<SharedPlot>(
		SharedPlots.getPlotComponentByOwnerID(Players.LocalPlayer.UserId),
	);

	constructor(mode: BuildingMode) {
		super(mode);

		{
			const selectorParent = new ComponentChild<Selectors.DesktopMultiSelector>(this, true);
			const create = () => {
				const selector = selectorParent.set(new Selectors.DesktopMultiSelector(this.plot.get()));
				selector.selectedBlocksChanged.Connect((selected) => this._selected.set(selected, true));
			};

			this.onEnable(create);
			this.event.subscribeObservable2(this.plot, create);

			this.event.subscribeObservable2(
				this.selectedMode,
				(mode) => selectorParent.get()?.setEnabled(mode === undefined),
				true,
			);
		}

		this.onDisable(() => this._selectedMode.set(undefined));
		this.event.subscribeObservable2(this.plot, () => this._selectedMode.set(undefined), true);
		this.event.subscribeObservable2(this.selectedMode, (mode) => {
			if (!mode) {
				this.controller.clear();
				return;
			}

			const selected = this._selected.get();
			if (isEmpty(selected)) {
				return;
			}

			const plot = isFullPlot(selected) ? selected : SharedPlots.getPlotByBlock(selected[0])!;
			this.controller.set(new Controllers[mode](plot, selected));
		});

		this.event.onKeyDown("F", () => this.toggleMode("Move"));
	}

	toggleMode(mode: EditToolMode | undefined) {
		if (mode === undefined || mode === this.selectedMode.get()) {
			this._selectedMode.set(undefined);
		} else {
			if (isEmpty(this._selected.get())) {
				return;
			}

			this._selectedMode.set(mode);
		}
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
