import { HttpService, ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { ClientComponentChild } from "client/component/ClientComponentChild";
import InputController from "client/controller/InputController";
import Signals from "client/event/Signals";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import Gui from "client/gui/Gui";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl, TextButtonControl, type TextButtonDefinition } from "client/gui/controls/Button";
import LogControl from "client/gui/static/LogControl";
import { InputTooltips, TooltipsHolder } from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import ToolBase from "client/tools/ToolBase";
import { HoveredBlocksHighlighter } from "client/tools/selectors/HoveredBlocksHighlighter";
import { SelectedBlocksHighlighter } from "client/tools/selectors/SelectedBlocksHighlighter";
import Remotes from "shared/Remotes";
import BlockManager from "shared/building/BlockManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { ComponentChild } from "shared/component/ComponentChild";
import { type TransformProps } from "shared/component/Transform";
import { TransformService } from "shared/component/TransformService";
import NumberObservableValue from "shared/event/NumberObservableValue";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import ObservableValue, { type ReadonlyObservableValue } from "shared/event/ObservableValue";
import { AABB } from "shared/fixes/AABB";
import Objects from "shared/fixes/objects";

namespace Scene {
	export interface EditToolSceneDefinition extends GuiObject, Selectors.SelectorGuiDefinition {
		readonly Bottom: GuiObject & {
			readonly MoveButton: GuiButton;
			readonly CloneButton: GuiButton;
		};
	}

	export class EditToolScene extends Control<EditToolSceneDefinition> {
		readonly tool;

		constructor(gui: EditToolSceneDefinition, tool: EditTool) {
			super(gui);
			this.tool = tool;

			const move = this.add(new ButtonControl(this.gui.Bottom.MoveButton, () => tool.toggleMode("Move")));
			const clone = this.add(new ButtonControl(this.gui.Bottom.CloneButton, () => tool.cloneBlocks()));

			const buttons: readonly ButtonControl[] = [move, clone];
			this.event.subscribeCollection(
				tool.selected,
				() => {
					const enabled = tool.selected.size() !== 0;

					for (const button of buttons) {
						button.getGui().Active = button.getGui().AutoButtonColor = enabled;
						TransformService.run(button.instance, (tr) =>
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
				ih.onKeyDown("ButtonY", sel);
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
			const add = InputController.isShiftPressed();
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
	export interface IController extends IComponent {}

	abstract class MoveBase extends ClientComponent implements IController {
		protected readonly tooltipHolder = this.parent(TooltipsHolder.createComponent("Moving"));

		protected readonly step: ReadonlyObservableValue<number>;
		protected readonly plot: SharedPlot;
		protected readonly blocks: readonly BlockModel[];
		protected readonly pivots: readonly (readonly [BlockModel, CFrame])[];
		protected readonly plotBounds: AABB;
		protected difference: Vector3 = Vector3.zero;

		constructor(plot: SharedPlot, blocks: readonly BlockModel[], step: ReadonlyObservableValue<number>) {
			super();

			this.plot = plot;
			this.blocks = blocks;
			this.step = step;
			this.plotBounds = plot.bounds;
			this.pivots = blocks.map((p) => [p, p.GetPivot()] as const);

			const moveHandles = this.initializeHandles();
			this.onDisable(async () => {
				await this.submit();
				moveHandles.Destroy();
			});

			this.onPrepare(() => this.tooltipHolder.set(this.getTooltips()));
		}

		protected abstract initializeHandles(): Instance;
		protected async submit(): Promise<boolean> {
			if (this.difference === Vector3.zero) {
				return true;
			}

			const response = await ClientBuilding.moveBlocks(this.plot, this.blocks, this.difference);
			if (!response.success) {
				LogControl.instance.addLine(response.message, Colors.red);
			}

			return response.success;
		}

		protected abstract getTooltips(): InputTooltips;
	}
	class DesktopMove extends MoveBase {
		protected initializeHandles() {
			const roundByStep = (number: number) => {
				const step = this.step.get();
				return number - (((number + step / 2) % step) - step / 2);
			};
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

			const initHandles = (instance: Handles) => {
				let startpos = Vector3.zero;
				let startDifference: Vector3 = Vector3.zero;

				const defaultCameraType = Workspace.CurrentCamera!.CameraType;
				this.event.subscribe(instance.MouseButton1Down, () => {
					startpos = moveHandles.GetPivot().Position;
					startDifference = this.difference;

					if (InputController.inputType.get() === "Touch") {
						Workspace.CurrentCamera!.CameraType = Enum.CameraType.Scriptable;
					}
				});
				this.event.subscribe(instance.MouseButton1Up, async () => {
					Workspace.CurrentCamera!.CameraType = defaultCameraType;
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

					this.difference = startDifference.add(Vector3.FromNormalId(face).mul(distance));
					if (!this.plotBounds.contains(aabb.withCenter(fullStartPos.add(this.difference)))) {
						return;
					}

					moveHandles.PivotTo(new CFrame(fullStartPos.add(this.difference)));
					for (const [block, startpos] of this.pivots) {
						block.PivotTo(startpos.add(this.difference));
					}
				});
			};

			const aabb = AABB.fromModels(this.blocks);

			const moveHandles = ReplicatedStorage.Assets.MoveHandles.Clone();
			moveHandles.Size = aabb.getSize().add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
			moveHandles.PivotTo(new CFrame(aabb.getCenter()));
			moveHandles.Parent = Gui.getPlayerGui();

			const fullStartPos: Vector3 = moveHandles.GetPivot().Position;
			initHandles(moveHandles.XHandles);
			initHandles(moveHandles.YHandles);
			initHandles(moveHandles.ZHandles);

			return moveHandles;
		}

		protected getTooltips(): InputTooltips {
			return { Desktop: [{ keys: ["F"], text: "Stop moving" }] };
		}
	}
	class TouchMove extends DesktopMove {}
	class GamepadMove extends MoveBase {
		protected initializeHandles() {
			let direction: "+x" | "-x" | "+z" | "-z" = "+x";

			const initHandles = (instance: MoveHandles) => {
				const tryAddDiff = (diff: Vector3) => {
					if (!this.plotBounds.contains(aabb.withCenter(fullStartPos.add(diff).add(this.difference)))) {
						return;
					}

					this.difference = this.difference.add(diff);
					moveHandles.PivotTo(new CFrame(fullStartPos.add(this.difference)));
					for (const [block, startpos] of this.pivots) {
						block.PivotTo(startpos.add(this.difference));
					}
				};

				this.event.subInput((ih) => {
					ih.onKeyDown("DPadUp", () => tryAddDiff(new Vector3(0, this.step.get(), 0)));
					ih.onKeyDown("DPadDown", () => tryAddDiff(new Vector3(0, -this.step.get(), 0)));
					ih.onKeyDown("DPadRight", () => tryAddDiff(getMoveDirection(true).mul(this.step.get())));
					ih.onKeyDown("DPadLeft", () => tryAddDiff(getMoveDirection(false).mul(this.step.get())));
				});

				const getMoveDirection = (positive: boolean) => {
					if (direction === "+x") {
						return positive ? Vector3.xAxis : Vector3.xAxis.mul(-1);
					} else if (direction === "-z") {
						return positive ? Vector3.zAxis.mul(-1) : Vector3.zAxis;
					} else if (direction === "+z") {
						return positive ? Vector3.zAxis : Vector3.zAxis.mul(-1);
					} else {
						return positive ? Vector3.xAxis.mul(-1) : Vector3.xAxis;
					}
				};
				const updateCamera = () => {
					const lookvector = Workspace.CurrentCamera!.CFrame.LookVector;
					if (math.abs(lookvector.X) > math.abs(lookvector.Z)) {
						direction = lookvector.X > 0 ? "+z" : "-z";
						instance.XHandles.Visible = false;
						instance.ZHandles.Visible = true;
					} else {
						direction = lookvector.Z > 0 ? "-x" : "+x";
						instance.XHandles.Visible = true;
						instance.ZHandles.Visible = false;
					}
				};
				this.event.subscribe(Signals.CAMERA.MOVED, updateCamera);
				this.onEnable(updateCamera);
			};

			const aabb = AABB.fromModels(this.blocks);

			const moveHandles = ReplicatedStorage.Assets.MoveHandles.Clone();
			moveHandles.Size = aabb.getSize().add(new Vector3(0.001, 0.001, 0.001)); // + 0.001 to avoid z-fighting
			moveHandles.PivotTo(new CFrame(aabb.getCenter()));
			moveHandles.Parent = Gui.getPlayerGui();

			const fullStartPos: Vector3 = moveHandles.GetPivot().Position;
			initHandles(moveHandles);

			return moveHandles;
		}

		protected getTooltips(): InputTooltips {
			return {
				Gamepad: [
					{ keys: ["ButtonX"], text: "Stop moving" },

					{ keys: ["DPadUp"], text: "Move up" },
					{ keys: ["DPadDown"], text: "Move down" },
					{ keys: ["DPadLeft"], text: "Move left (based on camera)" },
					{ keys: ["DPadRight"], text: "Move right (based on camera)" },
				],
			};
		}
	}

	export class Move extends ClientComponent implements IController {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

		constructor(plot: SharedPlot, blocks: readonly BlockModel[]) {
			super();

			ClientComponentChild.registerBasedOnInputType<IController>(this, {
				Desktop: () => new DesktopMove(plot, blocks, this.step),
				Touch: () => new TouchMove(plot, blocks, this.step),
				Gamepad: () => new GamepadMove(plot, blocks, this.step),
			});
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

	constructor(mode: BuildingMode) {
		super(mode);

		const gui = this.parentGui(
			new Scene.EditToolScene(ToolBase.getToolGui<"Edit", Scene.EditToolSceneDefinition>().Edit, this),
		);
		this.parent(new SelectedBlocksHighlighter(this.selected));

		{
			this.selector = this.parent(new Selectors.Selector(this.targetPlot, this._selected, gui.instance));
			this.event.subscribeObservable2(
				this.selectedMode,
				(mode) => this.selector?.setEnabled(mode === undefined),
				true,
			);
		}

		this.event.subscribeObservable2(this.selectedMode, (mode) =>
			this.tooltipHolder.set(mode === undefined ? this.getTooltips() : {}),
		);

		this.onDisable(() => this._selected.clear());
		this.onDisable(() => this._selectedMode.set(undefined));
		this.event.subscribeObservable2(this.targetPlot, () => this._selectedMode.set(undefined), true);
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

			this.controller.set(new Controllers[mode](this.targetPlot.get(), [...selected]));
		});

		this.event.onKeyDown("F", () => this.toggleMode("Move"));
		this.event.onKeyDown("ButtonX", () => this.toggleMode("Move"));
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
	async cloneBlocks() {
		const createBlocksCopy = (blocks: ReadonlySet<BlockModel>): readonly PlaceBlockRequest[] => {
			// <old, new>
			const uuidmap = new Map<BlockUuid, PlaceBlockRequest>();

			const newblocks = blocks.map((block): Writable<PlaceBlockRequest> => {
				const data = BlockManager.getBlockDataByBlockModel(block);
				const request: Writable<PlaceBlockRequest> = {
					id: data.id,
					uuid: HttpService.GenerateGUID(false) as BlockUuid,
					location: block.GetPivot(),
					color: data.color,
					material: data.material,
					config: data.config,
				};

				uuidmap.set(data.uuid, request);
				return request;
			});

			for (const [olduuid, newblock] of uuidmap) {
				//
			}

			return newblocks;
		};

		const response = await Remotes.Client.GetNamespace("Building")
			.Get("PlaceBlocks")
			.CallServerAsync({
				plot: this.targetPlot.get().instance,
				blocks: this.selected.get().map((block): PlaceBlockRequest => {
					const data = BlockManager.getBlockDataByBlockModel(block);

					const updateConnections = () => {
						//
					};

					return {
						id: data.id,
						location: block.GetPivot(),
						color: data.color,
						material: data.material,
						config: data.config,
					};
				}),
			});

		if (!response.success) {
			LogControl.instance.addLine(response.message, Colors.red);
			return;
		}

		this._selected.setRange(...response.models);
		this.toggleMode("Move");
	}

	getDisplayName(): string {
		return "Edit";
	}

	getImageID(): string {
		return "rbxassetid://12539306575";
	}

	protected getTooltips(): InputTooltips {
		return {
			Desktop: [{ keys: ["F"], text: "Move" }],
			Gamepad: [{ keys: ["ButtonX"], text: "Move" }],
		};
	}
}
