import { InputController } from "client/controller/InputController";
import { Control } from "client/gui/Control";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ConfigControl, ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { LogControl } from "client/gui/static/LogControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { HoveredBlockHighlighter } from "client/tools/selectors/HoveredBlockHighlighter";
import { TutorialConfigBlockHighlight } from "client/tutorial/TutorialConfigTool";
import { BlocksInitializer } from "shared/BlocksInitializer";
import { Colors } from "shared/Colors";
import { Logger } from "shared/Logger";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { Config } from "shared/config/Config";
import { ObservableValue } from "shared/event/ObservableValue";
import { Signal } from "shared/event/Signal";
import { JSON } from "shared/fixes/Json";
import { Objects } from "shared/fixes/objects";
import { VectorUtils } from "shared/utils/VectorUtils";

namespace Scene {
	export type ConfigToolSceneDefinition = GuiObject & {
		readonly ParamsSelection: Frame & {
			readonly Buttons: ConfigControlDefinition;
			readonly HeaderLabel: TextLabel;
		};
		readonly Bottom: {
			readonly DeselectButton: TextButton;
			readonly ResetButton: TextButton;
		};
	};
	export class ConfigToolScene extends Control<ConfigToolSceneDefinition> {
		private readonly configControl;

		constructor(gui: ConfigToolSceneDefinition, tool: ConfigTool) {
			super(gui);

			this.configControl = this.add(new ConfigControl(this.gui.ParamsSelection.Buttons));
			this.configControl.travelToConnectedPressed.Connect((uuid) => {
				tool.unselectAll();
				tool.selectBlockByUuid(uuid);
			});

			const selected = ObservableValue.fromSignal(tool.selectedBlocksChanged, []);
			this.event.subscribe(this.configControl.configUpdated, async (key, value) => {
				Logger.info(`Sending (${selected.get().size()}) block config values ${key} ${JSON.serialize(value)}`);

				const response = await ClientBuilding.updateConfigOperation.execute(
					tool.targetPlot.get(),
					selected
						.get()
						.map((p) => p.Parent)
						.map(
							(b) =>
								({
									block: b,
									key,
									value: JSON.serialize(value),
								}) satisfies ConfigUpdateRequest["configs"][number],
						),
				);
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
					this.updateConfigs(selected.get());
				}
			});

			tool.selectedBlocksChanged.Connect((selected) => {
				this.updateConfigs(selected);
			});

			this.gui.Bottom.DeselectButton.Activated.Connect(() => {
				tool.unselectAll();
			});

			this.gui.Bottom.ResetButton.Activated.Connect(async () => {
				Logger.info(`Resetting (${selected.get().size()}) block config values`);

				const response = await ClientBuilding.resetConfigOperation.execute(
					tool.targetPlot.get(),
					selected.get().map((p) => p.Parent),
				);

				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
				}

				this.updateConfigs(selected.get());
			});

			this.onPrepare((inputType) => {
				this.gui.Bottom.DeselectButton.Visible = inputType !== "Gamepad";
			});
		}

		show() {
			super.show();

			GuiAnimator.transition(this.gui.ParamsSelection, 0.2, "right");
			GuiAnimator.transition(this.gui.Bottom.DeselectButton, 0.22, "down");

			this.updateConfigs([]);
		}

		private updateConfigs(selected: readonly (SelectionBox & { Parent: BlockModel })[]) {
			const wasVisible = this.gui.Visible;

			this.gui.Visible = selected.size() !== 0;
			if (!this.gui.Visible) return;

			if (!wasVisible) GuiAnimator.transition(this.gui, 0.2, "up");
			const blockmodel = selected[0].Parent;
			const block = BlocksInitializer.blocks.map.get(BlockManager.manager.id.get(blockmodel))!;
			const onedef = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
				.input as BlockConfigTypes.Definitions;

			this.gui.Visible = Objects.keys(onedef).size() !== 0;
			if (!this.gui.Visible) return;

			this.gui.ParamsSelection.HeaderLabel.Text = `CONFIGURATION (${selected.size()})`;

			const configs = selected
				.map((selected) => {
					const blockmodel = selected.Parent;
					const block = BlocksInitializer.blocks.map.get(BlockManager.manager.id.get(blockmodel))!;

					const defs = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
						.input as BlockConfigTypes.Definitions;
					if (!defs) return undefined!;

					const config = Config.addDefaults(
						BlockManager.manager.config.get(blockmodel) as Record<string, number>,
						defs,
					);
					return [
						blockmodel,
						config,
						Objects.keys(BlockManager.manager.connections.get(blockmodel)),
					] as const;
				})
				.filter((x) => x !== undefined);

			this.configControl.set(configs[0][1], onedef, configs[0][2], configs[0][0]);
		}
	}
}

export class ConfigTool extends ToolBase {
	readonly blocksToConfigure: TutorialConfigBlockHighlight[] = [];
	private readonly gui;

	readonly selectedBlocksChanged = new Signal<(selected: (SelectionBox & { Parent: BlockModel })[]) => void>();
	private readonly selected: (SelectionBox & { Parent: BlockModel })[] = [];

	constructor(mode: BuildingMode) {
		super(mode);
		this.gui = this.parentGui(
			new Scene.ConfigToolScene(ToolBase.getToolGui<"Config", Scene.ConfigToolSceneDefinition>().Config, this),
		);

		const hoverSelector = this.parent(new HoveredBlockHighlighter((block) => this.canBeSelected(block)));
		const fireSelected = () => {
			const block = hoverSelector.highlightedBlock.get();
			if (!block) return;
			this.selectBlockByClick(block);
		};

		this.onPrepare((input) => {
			if (input === "Desktop") {
				this.inputHandler.onMouse1Down(() => {
					if (!InputController.isCtrlPressed()) {
						fireSelected();
					}
				}, false);
			} else if (input === "Gamepad") {
				this.inputHandler.onKeyDown("ButtonX", fireSelected);
			} else if (input === "Touch") {
				this.inputHandler.onTouchTap(fireSelected, false);
			}
		});

		// removed because doesnt follow the "single block type" rule
		/*
		const boxSelector = this.add(new BoxSelector(filter));
		this.event.subscribe(boxSelector.submitted, (blocks) => {
			for (const block of blocks) {
				this.trySelectBlock(block);
			}
		});
		*/

		// TODO: remove false later, deselects everything after any change
		if (false as boolean)
			this.subscribeToCurrentPlot((plot) => {
				if (!this.selected.any((s) => s.IsDescendantOf(plot.instance))) {
					return;
				}

				for (const sel of this.selected) {
					sel.Destroy();
				}

				this.selected.clear();
				this.selectedBlocksChanged.Fire(this.selected);
			});
	}

	private canBeSelected(block: BlockModel): boolean {
		if (this.blocksToConfigure.size() > 0) {
			if (
				!this.blocksToConfigure.any(
					(value) =>
						VectorUtils.roundVector(value.position) ===
						VectorUtils.roundVector(
							this.targetPlot
								.get()
								.instance.BuildingArea.GetPivot()
								.PointToObjectSpace(block.GetPivot().Position),
						),
				)
			) {
				return false;
			}
		}

		const config = blockConfigRegistry[BlockManager.manager.id.get(block) as keyof typeof blockConfigRegistry];
		if (!config) return false;

		if (!Objects.values(config.input).find((v) => !(v as BlockConfigTypes.Definition).configHidden)) {
			return false;
		}

		return true;
	}
	private canBeSelectedConsideringCurrentSelection(block: BlockModel): boolean {
		if (!this.canBeSelected(block)) {
			return false;
		}

		const differentId = this.selected.find(
			(s) => BlockManager.manager.id.get(s.Parent) !== (BlockManager.manager.id.get(block) as string),
		);
		return differentId === undefined;
	}
	private selectBlock(block: BlockModel) {
		const instance = new Instance("SelectionBox") as SelectionBox & { Parent: BlockModel };
		instance.Parent = block;
		instance.Adornee = block;
		instance.LineThickness = 0.05;
		instance.Color3 = Color3.fromRGB(0, 255 / 2, 255);

		this.selected.push(instance);
		this.selectedBlocksChanged.Fire(this.selected);
	}
	private selectBlockByClick(block: BlockModel | undefined) {
		const pc = InputController.inputType.get() === "Desktop";
		const add = InputController.inputType.get() === "Gamepad" || InputController.isShiftPressed();

		if (pc && !add) {
			for (const sel of this.selected) sel.Destroy();

			this.selected.clear();

			if (!block) this.selectedBlocksChanged.Fire(this.selected);
		}

		if (!block) {
			if (!pc) LogControl.instance.addLine("Block is not targeted!");
			return;
		}

		const removeOrAddHighlight = () => {
			const existing = this.selected.findIndex((sel) => sel.Parent === block);
			if (existing !== -1) {
				this.selected[existing].Destroy();
				this.selected.remove(existing);
				this.selectedBlocksChanged.Fire(this.selected);
			} else {
				if (!this.canBeSelectedConsideringCurrentSelection(block)) {
					LogControl.instance.addLine("Could not select different blocks");
					return;
				}

				this.selectBlock(block);
			}
		};

		if (pc) removeOrAddHighlight();
		else {
			if (add) this.selectBlock(block);
			else removeOrAddHighlight();
		}
	}

	selectBlockByUuid(uuid: BlockUuid) {
		this.selectBlock(SharedPlots.getBlockByUuid(this.targetPlot.get().instance, uuid));
	}
	unselectAll() {
		this.selected.forEach((element) => element.Destroy());
		this.selected.clear();
		this.selectedBlocksChanged.Fire(this.selected);
	}

	getDisplayName(): string {
		return "Configure";
	}

	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15414751900";
	}

	disable() {
		super.disable();
		this.unselectAll();
	}
}
