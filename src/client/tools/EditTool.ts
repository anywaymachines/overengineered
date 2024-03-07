import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl, TextButtonControl, type TextButtonDefinition } from "client/gui/controls/Button";
import LogControl from "client/gui/static/LogControl";
import type { TooltipSource } from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import ToolBase from "client/tools/ToolBase";
import { SelectedBlocksHighlighter } from "client/tools/selectors/SelectedBlocksHighlighter";
import Remotes from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import { SharedPlot } from "shared/building/SharedPlot";
import SharedPlots from "shared/building/SharedPlots";
import { ComponentChild } from "shared/component/ComponentChild";
import { type TransformProps } from "shared/component/Transform";
import { TransformService } from "shared/component/TransformService";
import NumberObservableValue from "shared/event/NumberObservableValue";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import ObservableValue, { type ReadonlyObservableValue } from "shared/event/ObservableValue";
import { AABB } from "shared/fixes/AABB";
import Objects from "shared/fixes/objects";
import HoveredBlockHighlighter from "./selectors/HoveredBlockHighlighter";
import { MultiModelHighlighter } from "./selectors/MultiModelHighlighter";

namespace Scene {
	export interface EditToolSceneDefinition extends GuiObject, Selectors.SelectorGuiDefinition {
		readonly Bottom: GuiObject & {
			readonly MoveButton: GuiButton;
		};
	}

	export class EditToolScene extends Control<EditToolSceneDefinition> {
		readonly tool;

		constructor(gui: EditToolSceneDefinition, tool: EditTool) {
			super(gui);
			this.tool = tool;

			const move = this.add(new ButtonControl(this.gui.Bottom.MoveButton, () => tool.toggleMode("Move")));

			const buttons: readonly ButtonControl[] = [move];
			this.event.subscribeCollection(
				tool.selected,
				() => {
					const enabled = tool.selected.size() !== 0;

					for (const button of buttons) {
						button.getGui().Active = button.getGui().AutoButtonColor = enabled;
						this.runTransform(button.instance, (tr) =>
							tr.transform("Transparency", enabled ? 0 : 0.6, {
								style: "Quad",
								direction: "Out",
								duration: 0.2,
							}),
						);
					}
				},
				true,
			);

			const modeButtons: Readonly<Record<EditToolMode, ButtonControl>> = { Move: move };
			this.event.subscribeObservable2(
				tool.selectedMode,
				(mode) => {
					for (const [name, button] of Objects.pairs(modeButtons)) {
						button.getGui().BackgroundColor3 = mode === name ? Colors.accentDark : Colors.staticBackground;
					}
				},
				true,
			);
		}

		show() {
			super.show();
			GuiAnimator.transition(this.gui.Bottom, 0.2, "up");
		}
	}
}

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

	export type SelectorGuiDefinition = GuiObject & {
		readonly MobileSelection: GuiObject & {
			readonly SingleSelection: TextButtonDefinition;
			readonly AssemblySelection: TextButtonDefinition;
		};
		readonly Top: GuiObject & {
			readonly SelectAllButton: TextButtonDefinition;
			readonly DeselectAllButton: TextButtonDefinition;
		};
	};
	interface SelectorGuiParams {
		readonly highlightModeName: ObservableValue<"single" | "assembly">;

		selectPlot(): void;
		deselectAll(): void;
	}
	class SelectorGui extends ClientComponent {
		constructor(gui: SelectorGuiDefinition, params: SelectorGuiParams) {
			super();

			class MobileSelection extends Control<SelectorGuiDefinition["MobileSelection"]> {
				constructor(gui: SelectorGuiDefinition["MobileSelection"]) {
					super(gui);

					const single = this.add(
						new TextButtonControl(gui.SingleSelection, () => params.highlightModeName.set("single")),
					);
					const assembly = this.add(
						new TextButtonControl(gui.AssemblySelection, () => params.highlightModeName.set("assembly")),
					);
					this.event.subscribeObservable2(
						params.highlightModeName,
						(active) => {
							const buttons: { readonly [k in typeof active]: TextButtonControl } = { single, assembly };
							for (const [name, button] of Objects.pairs(buttons)) {
								TransformService.run(button.instance, (builder, instance) =>
									builder
										.func(() => (instance.AutoButtonColor = instance.Active = active !== name))
										.transform(
											"BackgroundColor3",
											active === name ? Colors.accentDark : Colors.staticBackground,
											animationProps,
										),
								);
							}
						},
						true,
					);

					const animate = (enable: boolean) => {
						const buttonsAreActive = enable;

						TransformService.run(gui, (builder) =>
							builder.transform(
								"AnchorPoint",
								new Vector2(buttonsAreActive ? 1 : 0, 0.5),
								animationProps,
							),
						);

						for (const control of [single, assembly]) {
							const button = control.instance;

							button.AutoButtonColor = button.Active = buttonsAreActive;
							TransformService.run(button, (builder) =>
								builder.transform("Transparency", buttonsAreActive ? 0 : 0.6, animationProps),
							);
						}
					};

					this.onEnable(() => animate(true));
					this.onDisable(() => animate(false));
				}
			}

			const animationProps: TransformProps = {
				style: "Quad",
				direction: "Out",
				duration: 0.2,
			};

			const mobile = this.parent(new MobileSelection(gui.MobileSelection));
			this.onPrepare((inputType) => mobile.setVisible(inputType === "Touch"));

			const selectPlot = this.parent(new ButtonControl(gui.Top.SelectAllButton, () => params.selectPlot()));
			const deselectAll = this.parent(new ButtonControl(gui.Top.DeselectAllButton, () => params.deselectAll()));

			const animate = (enable: boolean) => {
				const buttonsAreActive = enable;

				TransformService.run(gui.Top, (builder) =>
					builder.transform("AnchorPoint", new Vector2(0.5, buttonsAreActive ? 0 : 0.8), animationProps),
				);

				for (const control of [selectPlot, deselectAll]) {
					const button = control.instance;

					button.AutoButtonColor = button.Active = buttonsAreActive;
					TransformService.run(button, (builder) =>
						builder.transform("Transparency", buttonsAreActive ? 0 : 0.6, animationProps),
					);
				}
			};

			this.onEnable(() => animate(true));
			this.onDisable(() => animate(false));
		}
	}

	export class Selector extends ClientComponent implements SelectorGuiParams {
		private readonly plot: ReadonlyObservableValue<SharedPlot>;
		private readonly selected: ObservableCollectionSet<BlockModel>;
		private readonly highlighterParent = new ComponentChild<HoveredBlocksHighlighter>(this);
		readonly highlightModeName = new ObservableValue<"single" | "assembly">("single");

		constructor(
			plot: ReadonlyObservableValue<SharedPlot>,
			selected: ObservableCollectionSet<BlockModel>,
			gui: SelectorGuiDefinition,
		) {
			super();
			this.plot = plot;
			this.selected = selected;
			this.parent(new SelectorGui(gui, this));

			this.highlighterParent = new ComponentChild<HoveredBlocksHighlighter>(this, true);
			this.event.subInput((ih) => {
				ih.onKeyDown("LeftControl", () => this.highlightModeName.set("assembly"));
				ih.onKeyUp("LeftControl", () => this.highlightModeName.set("single"));
			});

			const getHighlightModeFunc = (
				name: ReturnType<typeof this.highlightModeName.get>,
			): ((block: BlockModel) => readonly BlockModel[]) =>
				name === "assembly" ? (block) => this.getConnected(block) : (block) => [block];

			const updateHighlighter = () =>
				this.highlighterParent.set(
					new HoveredBlocksHighlighter(
						this.plot.get().instance,
						getHighlightModeFunc(this.highlightModeName.get()),
					),
				);
			this.event.subscribeObservable2(this.plot, updateHighlighter);
			this.event.subscribeObservable2(this.highlightModeName, updateHighlighter);
			this.onEnable(updateHighlighter);

			this.event.subInput((ih) => {
				const sel = () => this.selectBlocksByClick(this.highlighterParent.get()?.highlighted.get() ?? []);
				ih.onMouse1Down(sel, false);
				ih.onTouchTap(sel, false);
			});

			this.onDestroy(() => this.selected.clear());
		}

		private getConnected(block: BlockModel) {
			// using set to prevent duplicates
			return [
				...new Set(
					block.PrimaryPart!.GetConnectedParts(true).map((b) => BlockManager.getBlockDataByPart(b)!.instance),
				),
			];
		}

		selectPlot() {
			for (const block of this.plot.get().getBlocks()) {
				this.selectBlock(block);
			}
		}
		deselectAll() {
			this.selected.clear();
		}

		private selectBlock(block: BlockModel) {
			this.selected.add(block);
		}
		/** @returns A boolean indicating whether the block was successfully deselected */
		private deselectBlock(block: BlockModel): boolean {
			const existing = this.selected.has(block);
			if (!existing) return false;

			this.selected.remove(block);
			return true;
		}

		private selectBlocksByClick(blocks: readonly BlockModel[]) {
			const pc = InputController.inputType.get() === "Desktop";
			const add = InputController.inputType.get() === "Gamepad" || InputController.isShiftPressed();
			const selectConnected = this.highlightModeName.get() === "assembly";

			if (pc && !add) {
				this.selected.clear();
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

			if (selectConnected) {
				const allBlocksAlreadySelected = blocks.all((b) => this.selected.has(b));
				if (!allBlocksAlreadySelected) {
					for (const block of blocks) {
						this.selectBlock(block);
					}
				} else {
					toggleBlocksSelection();
				}
			} else if (pc) {
				toggleBlocksSelection();
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
	export interface IController extends IComponent, TooltipSource {}

	export class Move extends ClientComponent implements IController {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

		private readonly plot: PlotModel;
		private readonly blocks: ReadonlySet<BlockModel>;
		private readonly moveHandles: MoveHandles;
		private readonly plotBounds: AABB;

		constructor(plot: PlotModel, blocks: ReadonlySet<BlockModel>) {
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

			const initHandles = (instance: Handles, blocks: ReadonlySet<BlockModel>) => {
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

				const defaultCameraType = Workspace.CurrentCamera!.CameraType;
				this.event.subscribe(instance.MouseButton1Down, () => {
					startpos = moveHandles.GetPivot().Position;
					pivots = blocks.map((p) => [p, p.GetPivot()] as const);

					if (InputController.inputType.get() === "Touch") {
						Workspace.CurrentCamera!.CameraType = Enum.CameraType.Scriptable;
					}
				});
				this.event.subscribe(instance.MouseButton1Up, async () => {
					Workspace.CurrentCamera!.CameraType = defaultCameraType;
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

			const aabb = AABB.fromModelsSet(this.blocks);

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
			const response = await Remotes.Client.GetNamespace("Building")
				.Get("MoveBlocks")
				.CallServerAsync({
					plot: this.plot,
					blocks: [...this.blocks],
					diff,
				});

			if (!response.success) {
				LogControl.instance.addLine(response.message, Colors.red);
			}

			return response.success;
		}

		getGamepadTooltips(): readonly { readonly key: Enum.KeyCode; readonly text: string }[] {
			return [];
		}
		getKeyboardTooltips(): readonly { readonly keys: string[]; readonly text: string }[] {
			return [];
		}
	}
}

export type EditToolMode = "Move";
export default class EditTool extends ToolBase {
	private readonly _selectedMode = new ObservableValue<EditToolMode | undefined>(undefined);
	readonly selectedMode = this._selectedMode.asReadonly();
	private readonly _selected = new ObservableCollectionSet<BlockModel>();
	readonly selected = this._selected.asReadonly();
	private readonly controller = new ComponentChild<Controllers.IController>(this, true);
	private readonly selector;
	private readonly plot = new ObservableValue<SharedPlot>(
		SharedPlots.getPlotComponentByOwnerID(Players.LocalPlayer.UserId),
	);

	constructor(mode: BuildingMode) {
		super(mode);

		const gui = this.parentGui(
			new Scene.EditToolScene(ToolBase.getToolGui<"Edit", Scene.EditToolSceneDefinition>().Edit, this),
		);
		this.parent(new SelectedBlocksHighlighter(this.selected));

		{
			this.selector = this.parent(new Selectors.Selector(this.plot, this._selected, gui.instance));
			this.event.subscribeObservable2(
				this.selectedMode,
				(mode) => this.selector?.setEnabled(mode === undefined),
				true,
			);
		}

		this.onDisable(() => this._selected.clear());
		this.onDisable(() => this._selectedMode.set(undefined));
		this.event.subscribeObservable2(this.plot, () => this._selectedMode.set(undefined), true);
		this.event.subscribeObservable2(this.selectedMode, (mode) => {
			if (!mode) {
				this.controller.clear();
				return;
			}

			const selected = this._selected.get();
			if (selected.size() === 0) {
				return;
			}

			let first: BlockModel = undefined!;
			for (const block of selected) {
				first = block;
				break;
			}

			const plot = SharedPlots.getPlotByBlock(first)!;
			this.controller.set(new Controllers[mode](plot, selected));
		});

		this.controller.childSet.Connect(() => this.updateTooltips());
		this.event.onKeyDown("F", () => this.toggleMode("Move"));
	}
	protected getTooltipsSource(): TooltipSource | undefined {
		return this.controller.get() ?? super.getTooltipsSource();
	}

	toggleMode(mode: EditToolMode | undefined) {
		if (mode === undefined || mode === this.selectedMode.get()) {
			this._selectedMode.set(undefined);
		} else {
			if (this._selected.size() === 0) {
				return;
			}

			this._selectedMode.set(mode);
		}
	}
	selectPlot() {
		this.selector.selectPlot();
	}
	deselectAll() {
		this.selector.deselectAll();
	}

	getDisplayName(): string {
		return "Edit (DEV TEST)";
	}

	getImageID(): string {
		return "rbxassetid://12539306575";
	}

	getGamepadTooltips(): { key: Enum.KeyCode; text: string }[] {
		return [];
	}
	getKeyboardTooltips(): readonly { readonly keys: KeyCode[]; readonly text: string }[] {
		return [{ keys: ["F"], text: "Move" }];
	}
}
