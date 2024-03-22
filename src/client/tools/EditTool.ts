import { HttpService, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import InputController from "client/controller/InputController";
import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import { ButtonControl, TextButtonControl, type TextButtonDefinition } from "client/gui/controls/Button";
import LogControl from "client/gui/static/LogControl";
import { InputTooltips } from "client/gui/static/TooltipsControl";
import BuildingMode from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import ToolBase from "client/tools/ToolBase";
import { BlockMover } from "client/tools/selectors/BlockMover";
import { HoveredBlocksHighlighter } from "client/tools/selectors/HoveredBlocksHighlighter";
import { SelectedBlocksHighlighter } from "client/tools/selectors/SelectedBlocksHighlighter";
import { Element } from "shared/Element";
import BlockManager from "shared/building/BlockManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { ComponentChild } from "shared/component/ComponentChild";
import { type TransformProps } from "shared/component/Transform";
import { TransformService } from "shared/component/TransformService";
import NumberObservableValue from "shared/event/NumberObservableValue";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import ObservableValue, { type ReadonlyObservableValue } from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";
import PartUtils from "shared/utils/PartUtils";

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
			const clone = this.add(new ButtonControl(this.gui.Bottom.CloneButton, () => tool.toggleMode("Clone")));

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

			const modeButtons: Readonly<Record<EditToolMode, ButtonControl>> = { Move: move, Clone: clone };
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
	export class Move extends ClientComponent {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

		constructor(plot: SharedPlot, blocks: readonly BlockModel[]) {
			super();

			const mover = this.parent(new BlockMover(plot, blocks));
			this.step.autoSet(mover.step);

			mover.moved.Connect(async (diff) => {
				if (diff === Vector3.zero) {
					return true;
				}

				const response = await ClientBuilding.moveBlocks(plot, blocks, diff);
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
				}

				return response.success;
			});
		}
	}
	export class Clone extends ClientComponent {
		readonly step = new NumberObservableValue<number>(1, 1, 256, 1);

		constructor(plot: SharedPlot, blocks: readonly BlockModel[]) {
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

			const mover = this.parent(
				new BlockMover(
					plot,
					blocks.map((b) => {
						b = b.Clone();
						PartUtils.ghostModel(b, Colors.blue);
						b.Parent = ghostParent;

						return b;
					}),
				),
			);
			this.step.autoSet(mover.step);

			mover.moved.Connect(async (diff) => {
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
						for (const [, connection] of Objects.pairs(connections)) {
							const neww = uuidmap.get(connection.blockUuid);
							if (!neww) continue;

							(connection as Writable<typeof connection>).blockUuid = neww.uuid;
						}

						newblock.connections = connections;
					}

					return newblocks;
				};

				const response = await ClientBuilding.placeBlocks(plot, createBlocksCopy(blocks));
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
				}

				return response.success;
			});
		}
	}
}

export type EditToolMode = "Move" | "Clone";
export default class EditTool extends ToolBase {
	private readonly _selectedMode = new ObservableValue<EditToolMode | undefined>(undefined);
	readonly selectedMode = this._selectedMode.asReadonly();
	private readonly _selected = new ObservableCollectionSet<BlockModel>();
	readonly selected = this._selected.asReadonly();
	private readonly controller = new ComponentChild<IComponent>(this, true);
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
