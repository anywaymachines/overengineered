import { HttpService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { InputController } from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import {
	MaterialColorEditControl,
	MaterialColorEditControlDefinition,
} from "client/gui/buildmode/MaterialColorEditControl";
import { ButtonControl, TextButtonControl, type TextButtonDefinition } from "client/gui/controls/Button";
import { LogControl } from "client/gui/static/LogControl";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { BlockMover } from "client/tools/selectors/BlockMover";
import { BlockRotater } from "client/tools/selectors/BlockRotater";
import { HoveredBlocksHighlighter } from "client/tools/selectors/HoveredBlocksHighlighter";
import { SelectedBlocksHighlighter } from "client/tools/selectors/SelectedBlocksHighlighter";
import { Element } from "shared/Element";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { SharedPlot } from "shared/building/SharedPlot";
import { ComponentChild } from "shared/component/ComponentChild";
import { ComponentDisabler } from "shared/component/ComponentDisabler";
import { TransformService } from "shared/component/TransformService";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { ObservableValue, type ReadonlyObservableValue } from "shared/event/ObservableValue";
import { Objects } from "shared/fixes/objects";
import { PartUtils } from "shared/utils/PartUtils";

namespace Scene {
	export interface EditToolSceneDefinition extends GuiObject, Selectors.SelectorGuiDefinition {
		readonly CancelButton: GuiButton;
		readonly Paint: MaterialColorEditControlDefinition;
		readonly Bottom: GuiObject & {
			readonly MoveButton: GuiButton;
			readonly RotateButton: GuiButton;
			readonly CloneButton: GuiButton;
			readonly DeleteButton: GuiButton;
			readonly PaintButton: GuiButton;
		};
	}

	export class EditToolScene extends Control<EditToolSceneDefinition> {
		readonly tool;

		constructor(gui: EditToolSceneDefinition, tool: EditTool) {
			super(gui);
			this.tool = tool;

			{
				const cancel = this.add(new ButtonControl(this.gui.CancelButton, () => tool.cancelCurrentMode()));

				const animateCancelButton = TransformService.boolStateMachine(
					cancel.instance,
					TransformService.commonProps.quadOut02,
					{ Position: cancel.instance.Position, Transparency: 0 },
					{ Position: cancel.instance.Position.add(new UDim2(0, 0, 0, 20)), Transparency: 1 },
					(tr) => tr.func(() => (cancel.instance.Interactable = false)),
					(tr) => tr.func(() => (cancel.instance.Interactable = true)),
				);

				this.event.subscribeObservable(
					tool.selectedMode,
					(mode) => animateCancelButton(mode !== undefined),
					true,
				);
			}

			const move = this.add(new ButtonControl(this.gui.Bottom.MoveButton, () => tool.toggleMode("Move")));
			const rotate = this.add(new ButtonControl(this.gui.Bottom.RotateButton, () => tool.toggleMode("Rotate")));
			const clone = this.add(new ButtonControl(this.gui.Bottom.CloneButton, () => tool.toggleMode("Clone")));
			const paint = this.add(new ButtonControl(this.gui.Bottom.PaintButton, () => tool.toggleMode("Paint")));
			const del = this.add(new ButtonControl(this.gui.Bottom.DeleteButton, () => tool.deleteSelectedBlocks()));

			const multiValueSetter = <T>(instance: T, func: (value: boolean) => void) => {
				const values: boolean[] = [];

				return {
					instance,
					set: (index: number, value: boolean) => {
						values[index] = value;
						func(values.all((v) => v));
					},
				} as const;
			};
			type mvs = ReturnType<typeof multiValueSetter<Control>>;

			const movemvs = multiValueSetter(move, (v) => move.setInteractable(v));
			const rotatemvs = multiValueSetter(rotate, (v) => rotate.setInteractable(v));
			const clonemvs = multiValueSetter(clone, (v) => clone.setInteractable(v));
			const paintmvs = multiValueSetter(paint, (v) => paint.setInteractable(v));
			const delmvs = multiValueSetter(del, (v) => del.setInteractable(v));

			const buttons: Readonly<Record<EditToolButtons, mvs>> = {
				// edit tool modes
				Move: movemvs,
				Rotate: rotatemvs,
				Clone: clonemvs,
				Paint: paintmvs,

				// other buttons
				Delete: delmvs,
			};
			this.event.subscribeObservable(
				tool.enabledModes.enabled,
				(enabledModes) => {
					for (const [name, button] of Objects.pairs_(buttons)) {
						button.set(2, enabledModes.includes(name));
					}
				},
				true,
			);

			this.event.subscribeCollection(
				tool.selected,
				() => {
					const enabled = tool.selected.size() !== 0;
					for (const [, button] of Objects.pairs_(buttons)) {
						button.set(0, enabled);
					}
				},
				true,
			);

			this.event.subscribeObservable(
				tool.selectedMode,
				(mode) => {
					for (const [name, button] of Objects.pairs_(buttons)) {
						button.instance.instance.BackgroundColor3 =
							mode === name ? Colors.accentDark : Colors.staticBackground;

						const enabled = mode === undefined || mode === name;
						button.set(1, enabled);
					}
				},
				true,
			);
		}

		private readonly bottomVisibilityFunction = TransformService.multi(
			TransformService.boolStateMachine(
				this.instance.Bottom,
				TransformService.commonProps.quadOut02,
				{ Position: this.instance.Bottom.Position },
				{ Position: this.instance.Bottom.Position.add(new UDim2(0, 0, 0, 20)) },
				(tr, visible) =>
					tr.func(() => {
						for (const [, button] of Objects.pairs_(this.getChildren())) {
							if (button instanceof ButtonControl) {
								button.setVisible(visible);
							}
						}
					}),
				(tr, visible) => tr.func(() => super.setInstanceVisibilityFunction(visible)),
			),
			TransformService.boolStateMachine(this.instance, TransformService.commonProps.quadOut02, {}, {}),
		);
		protected setInstanceVisibilityFunction(visible: boolean): void {
			if (visible) {
				super.setInstanceVisibilityFunction(visible);
			}

			this.bottomVisibilityFunction(visible);
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
					this.event.subscribeObservable(
						params.highlightModeName,
						(active) => {
							const buttons: { readonly [k in typeof active]: TextButtonControl } = { single, assembly };
							for (const [name, button] of Objects.pairs_(buttons)) {
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

			const animationProps = TransformService.commonProps.quadOut02;

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
		private readonly highlighterParent = new ComponentChild<HoveredBlocksHighlighter>(this);
		readonly selected: ObservableCollectionSet<BlockModel>;
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
			this.event.subscribeObservable(this.plot, updateHighlighter);
			this.event.subscribeObservable(this.highlightModeName, updateHighlighter);
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
	export class Move extends ClientComponent {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);
		private readonly mover;

		constructor(tool: EditTool, plot: SharedPlot, blocks: readonly BlockModel[]) {
			super();

			this.mover = this.parent(BlockMover.create(plot, blocks));
			this.step.autoSet(this.mover.step);

			this.onDestroy(async () => {
				const diff = this.mover.getDifference();
				if (diff === Vector3.zero) {
					return true;
				}

				const response = await ClientBuilding.moveOperation.execute(plot, blocks, diff);
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
					this.cancel();
				}

				tool.selected.setRange(blocks);
			});
		}

		cancel() {
			this.mover.cancel();
		}
	}

	export class Clone extends ClientComponent {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);
		private readonly blocks;
		private readonly mover;

		constructor(tool: EditTool, plot: SharedPlot, blocks: readonly BlockModel[]) {
			super();

			const ghostParent = Element.create(
				"Model",
				{ Parent: Workspace },
				{
					highlight: Element.create("Highlight", {
						FillColor: Colors.blue,
						FillTransparency: 0.4,
						OutlineTransparency: 0.5,
						DepthMode: Enum.HighlightDepthMode.Occluded,
					}),
				},
			);
			this.onDestroy(() => ghostParent.Destroy());

			this.blocks = blocks.map((b) => {
				b = b.Clone();
				PartUtils.ghostModel(b, Colors.blue);
				b.Parent = ghostParent;

				return b;
			});

			this.mover = this.parent(BlockMover.create(plot, this.blocks));
			this.step.autoSet(this.mover.step);

			this.onDestroy(async () => {
				const diff = this.mover.getDifference();
				if (diff === Vector3.zero) {
					return true;
				}

				const createBlocksCopy = (blocks: readonly BlockModel[]): readonly PlaceBlockRequest[] => {
					const existingBlocks = new Map<BlockUuid, BlockData>();
					for (const block of blocks) {
						const data = BlockManager.getBlockDataByBlockModel(block);
						existingBlocks.set(data.uuid, data);
					}

					// <old, new>
					const uuidmap = new Map<BlockUuid, Writable<PlaceBlockRequest & { uuid: BlockUuid }>>();

					const newblocks = existingBlocks.map((_, data): Writable<PlaceBlockRequest> => {
						const request = {
							id: data.id,
							uuid: HttpService.GenerateGUID(false) as BlockUuid,
							location: data.instance.GetPivot().add(diff),
							color: data.color,
							material: data.material,
							config: data.config,
						} satisfies PlaceBlockRequest;

						uuidmap.set(data.uuid, request);
						return request;
					});

					for (const [olduuid, newblock] of uuidmap) {
						const connections = { ...(existingBlocks.get(olduuid)?.connections ?? {}) };
						for (const [, connection] of Objects.pairs_(connections)) {
							const neww = uuidmap.get(connection.blockUuid);
							if (!neww) continue;

							(connection as Writable<typeof connection>).blockUuid = neww.uuid;
						}

						newblock.connections = connections;
					}

					return newblocks;
				};

				const response = await ClientBuilding.placeOperation.execute(plot, createBlocksCopy(blocks));
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
					this.cancel();
				}

				return response.success;
			});
		}

		cancel() {
			this.mover.cancel();
			for (const block of this.blocks) {
				block.Destroy();
			}
		}
	}
	export class Rotate extends ClientComponent {
		readonly step = new NumberObservableValue<number>(0, 90, 180, 90);
		private readonly rotater;

		constructor(tool: EditTool, plot: SharedPlot, blocks: readonly BlockModel[]) {
			super();

			this.rotater = this.parent(BlockRotater.create(plot, blocks));
			this.step.autoSet(this.rotater.step);

			this.onDestroy(async () => {
				if (!this.rotater.isValidRotation()) {
					LogControl.instance.addLine("Invalid rotation", Colors.red);
					this.cancel();
					return;
				}

				const diff = this.rotater.getDifference();
				if (diff === CFrame.identity) {
					return true;
				}

				const pivot = this.rotater.getPivot();
				const response = await ClientBuilding.rotateOperation.execute(plot, blocks, pivot, diff);
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
					this.cancel();
				}

				return response.success;
			});
		}

		cancel() {
			this.rotater.cancel();
		}
	}
	export class Paint extends ClientComponent {
		private static readonly material = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
		private static readonly color = new ObservableValue<Color3>(new Color3(1, 1, 1));
		private readonly origData: ReadonlyMap<BlockModel, readonly [material: Enum.Material, color: Color3]>;

		constructor(tool: EditTool, plot: SharedPlot, blocks: readonly BlockModel[]) {
			super();

			this.origData = new ReadonlyMap(
				blocks.map(
					(b) => [b, [BlockManager.manager.material.get(b), BlockManager.manager.color.get(b)]] as const,
				),
			);

			const ui = tool.gui.instance.Paint.Clone();
			ui.Parent = tool.gui.instance.Paint.Parent;
			this.parentGui(new MaterialColorEditControl(ui, Paint.material, Paint.color));
			this.event.subscribeObservable(
				Paint.material,
				(material) => {
					for (const block of blocks) {
						SharedBuilding.paint([block], undefined, material);
					}
				},
				true,
			);
			this.event.subscribeObservable(
				Paint.color,
				(color) => {
					for (const block of blocks) {
						SharedBuilding.paint([block], color, undefined);
					}
				},
				true,
			);

			this.onDestroy(async () => {
				const response = await ClientBuilding.paintOperation.execute(
					plot,
					blocks,
					Paint.material.get(),
					Paint.color.get(),
					this.origData,
				);
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
					this.cancel();
				}

				return response.success;
			});
		}

		cancel() {
			for (const [block, [material, color]] of this.origData) {
				SharedBuilding.paint([block], color, material);
			}
		}
	}
}

export type EditToolMode = "Move" | "Clone" | "Rotate" | "Paint";
export type EditToolButtons = EditToolMode | "Delete";

export class EditTool extends ToolBase {
	readonly enabledModes = new ComponentDisabler(["Move", "Rotate", "Clone", "Paint", "Delete"]);

	private readonly _selectedMode = new ObservableValue<EditToolMode | undefined>(undefined);
	readonly selectedMode = this._selectedMode.asReadonly();
	readonly selected = new ObservableCollectionSet<BlockModel>();
	private readonly controller = new ComponentChild<IComponent & { cancel(): void }>(this, true);
	private readonly selector;
	readonly gui;

	constructor(mode: BuildingMode) {
		super(mode);

		this.gui = this.parentGui(
			new Scene.EditToolScene(ToolBase.getToolGui<"Edit", Scene.EditToolSceneDefinition>().Edit, this),
		);
		this.parent(new SelectedBlocksHighlighter(this.selected));

		{
			this.selector = this.parent(new Selectors.Selector(this.targetPlot, this.selected, this.gui.instance));
			this.event.subscribeObservable(
				this.selectedMode,
				(mode) => this.selector?.setEnabled(mode === undefined),
				true,
			);
		}

		this.event.subscribeObservable(this.selectedMode, (mode) =>
			this.tooltipHolder.set(mode === undefined ? this.getTooltips() : {}),
		);

		this.onDisable(() => this.selected.clear());
		this.onDisable(() => this._selectedMode.set(undefined));
		this.event.subscribeObservable(this.targetPlot, () => this._selectedMode.set(undefined), true);
		this.event.subscribeObservable(this.selectedMode, (mode) => {
			if (!mode) {
				this.controller.clear();
				return;
			}

			const selected = this.selected.get();
			if (selected.size() === 0) {
				return;
			}

			this.controller.set(new Controllers[mode](this, this.targetPlot.get(), [...selected]));
		});

		this.event.onKeyDown("F", () => this.toggleMode("Move"));
		this.event.onKeyDown("ButtonX", () => this.toggleMode("Move"));
	}

	cancelCurrentMode() {
		this.controller.get()?.cancel();
		this.toggleMode(undefined);
	}

	toggleMode(mode: EditToolMode | undefined) {
		if (mode && !this.enabledModes.enabled.get().includes(mode)) {
			this._selectedMode.set(undefined);
			return;
		}

		if (mode === undefined || mode === this.selectedMode.get()) {
			this._selectedMode.set(undefined);
		} else {
			if (this.selected.size() === 0) {
				return;
			}

			this._selectedMode.set(undefined);
			this._selectedMode.set(mode);
		}
	}
	selectPlot() {
		this.selector.selectPlot();
	}
	deselectAll() {
		this.selector.deselectAll();
	}

	async deleteSelectedBlocks() {
		const selected = [...this.selected.get()];
		this.selected.setRange([]);

		await ClientBuilding.deleteOperation.execute(this.targetPlot.get(), selected);
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
