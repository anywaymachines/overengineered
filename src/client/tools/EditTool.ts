import { HttpService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { MaterialColorEditControl } from "client/gui/buildmode/MaterialColorEditControl";
import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { LogControl } from "client/gui/static/LogControl";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { BlockGhoster } from "client/tools/additional/BlockGhoster";
import { BlockMover } from "client/tools/additional/BlockMover";
import { BlockRotater } from "client/tools/additional/BlockRotater";
import { MultiBlockHighlightedSelector } from "client/tools/highlighters/MultiBlockHighlightedSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { ToolBase } from "client/tools/ToolBase";
import { BlockRegistry } from "shared/block/BlockRegistry";
import { BlockManager } from "shared/building/BlockManager";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { ComponentChild } from "shared/component/ComponentChild";
import { ComponentDisabler } from "shared/component/ComponentDisabler";
import { TransformService } from "shared/component/TransformService";
import { Element } from "shared/Element";
import { NumberObservableValue } from "shared/event/NumberObservableValue";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { ObservableValue } from "shared/event/ObservableValue";
import { PartUtils } from "shared/utils/PartUtils";
import type { MaterialColorEditControlDefinition } from "client/gui/buildmode/MaterialColorEditControl";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { InputTooltips } from "client/gui/static/TooltipsControl";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { BlockSelectorModeGuiDefinition } from "client/tools/highlighters/BlockSelectorModeGui";
import type { SharedPlot } from "shared/building/SharedPlot";

namespace Scene {
	type MultiBlockSelectorGuiDefinition = GuiObject & {
		readonly MobileSelection: BlockSelectorModeGuiDefinition;
		readonly Top: GuiObject & {
			readonly SelectAllButton: TextButtonDefinition;
			readonly DeselectAllButton: TextButtonDefinition;
		};
	};
	interface MultiBlockSelectorGuiParams {
		selectPlot(): void;
		deselectAll(): void;
	}
	export class MultiBlockSelectorGui extends ClientComponent {
		constructor(gui: MultiBlockSelectorGuiDefinition, params: MultiBlockSelectorGuiParams) {
			super();

			const animationProps = TransformService.commonProps.quadOut02;
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

	export interface EditToolSceneDefinition extends GuiObject, MultiBlockSelectorGuiDefinition {
		readonly CancelButton: GuiButton;
		readonly Paint: MaterialColorEditControlDefinition;
		readonly Bottom: GuiObject & {
			readonly MoveButton: GuiButton;
			readonly RotateButton: GuiButton;
			readonly CopyButton: GuiButton;
			readonly PasteButton: GuiButton;
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
			const copy = this.add(
				new ButtonControl(this.gui.Bottom.CopyButton, () => {
					tool.copySelectedBlocks();
					paste.setInteractable(true);
				}),
			);
			const paste = this.add(new ButtonControl(this.gui.Bottom.PasteButton, () => tool.toggleMode("Paste")));
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
			const copymvs = multiValueSetter(copy, (v) => copy.setInteractable(v));
			const pastemvs = multiValueSetter(paste, (v) => paste.setInteractable(v));
			const paintmvs = multiValueSetter(paint, (v) => paint.setInteractable(v));
			const delmvs = multiValueSetter(del, (v) => del.setInteractable(v));

			const buttons: Readonly<Record<EditToolButtons, mvs>> = {
				// edit tool modes
				Move: movemvs,
				Rotate: rotatemvs,
				Paste: pastemvs,
				Paint: paintmvs,

				// other buttons
				Copy: copymvs,
				Delete: delmvs,
			};
			this.event.subscribeObservable(
				tool.enabledModes.enabled,
				(enabledModes) => {
					for (const [name, button] of pairs(buttons)) {
						button.set(2, enabledModes.includes(name));
					}
				},
				true,
			);

			const updateButtonInteractability = () => {
				for (const [name, button] of pairs(buttons)) {
					button.set(0, canBeSelected(tool, name));
				}
			};
			this.event.subscribeCollection(tool.selected, updateButtonInteractability, true);
			this.event.subscribeObservable(tool.copied, updateButtonInteractability, true);

			this.event.subscribeObservable(
				tool.selectedMode,
				(mode) => {
					for (const [name, button] of pairs(buttons)) {
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
						for (const [, button] of pairs(this.getChildren())) {
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

const placeToBlocksRequests = (blocks: readonly BlockModel[]): readonly PlaceBlockRequest[] => {
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
			location: data.instance.GetPivot(),
			color: data.color,
			material: data.material,
			config: data.config,
		} satisfies PlaceBlockRequest;

		uuidmap.set(data.uuid, request);
		return request;
	});

	for (const [olduuid, newblock] of uuidmap) {
		const connections = { ...(existingBlocks.get(olduuid)?.connections ?? {}) };
		for (const [, connection] of pairs(connections)) {
			const neww = uuidmap.get(connection.blockUuid);
			if (!neww) continue;

			(connection as Writable<typeof connection>).blockUuid = neww.uuid;
		}

		newblock.connections = connections;
	}

	return newblocks;
};

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

				if (tool.isEnabled()) {
					tool.selected.setRange(blocks);
				}
			});
		}

		cancel() {
			this.mover.cancel();
		}
	}
	export class Paste extends ClientComponent {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);
		private readonly blocks;
		private readonly mover;

		constructor(tool: EditTool, plot: SharedPlot) {
			super();

			const ghostParent = Element.create(
				"Model",
				{ Parent: Workspace },
				{ highlight: BlockGhoster.createHighlight({ FillColor: Colors.blue }) },
			);
			this.onDestroy(() => ghostParent.Destroy());

			const blocks = tool.copied.get();
			this.blocks = blocks.map((block) => {
				const b = BlockRegistry.map.get(block.id)!.model.Clone();
				b.PivotTo(block.location);
				PartUtils.ghostModel(b, Colors.blue);
				b.Parent = ghostParent;

				return b;
			});

			this.mover = this.parent(BlockMover.create(plot, this.blocks));
			this.step.autoSet(this.mover.step);

			this.onDestroy(async () => {
				const diff = this.mover.getDifference();
				const response = await ClientBuilding.placeOperation.execute(
					plot,
					blocks.map((b) => ({ ...b, location: b.location.add(diff) })),
				);
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
			this.parentGui(new MaterialColorEditControl(ui, Paint.material, Paint.color, true));

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

const canBeSelected = (tool: EditTool, mode: EditToolButtons): boolean => {
	if (mode === "Paste") {
		return tool.copied.get().size() !== 0;
	}

	return tool.selected.get().size() !== 0;
};

export type EditToolMode = "Move" | "Paste" | "Rotate" | "Paint";
export type EditToolButtons = EditToolMode | "Copy" | "Delete";

export class EditTool extends ToolBase {
	readonly enabledModes = new ComponentDisabler<EditToolButtons>([
		"Move",
		"Rotate",
		"Copy",
		"Paste",
		"Paint",
		"Delete",
	]);

	private readonly _selectedMode = new ObservableValue<EditToolMode | undefined>(undefined);
	readonly selectedMode = this._selectedMode.asReadonly();
	readonly selected = new ObservableCollectionSet<BlockModel>();
	readonly copied = new ObservableValue<readonly PlaceBlockRequest[]>([]);
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
			this.selector = this.parent(
				new MultiBlockHighlightedSelector(this.targetPlot, this.selected, this.gui.instance.MobileSelection),
			);
			this.event.subscribeObservable(
				this.selectedMode,
				(mode) => this.selector?.setEnabled(mode === undefined),
				true,
			);

			this.parent(new Scene.MultiBlockSelectorGui(this.gui.instance, this));
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
			if (!canBeSelected(this, mode)) {
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
			if (!canBeSelected(this, mode)) {
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

	copySelectedBlocks() {
		this.copied.set(placeToBlocksRequests([...this.selected.get()]));
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
