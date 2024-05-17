import { InputController } from "client/controller/InputController";
import { Control } from "client/gui/Control";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { MultiConfigControl } from "client/gui/config/MultiConfigControl";
import { LogControl } from "client/gui/static/LogControl";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { ToolBase } from "client/tools/ToolBase";
import { MultiBlockHighlightedSelector } from "client/tools/highlighters/MultiBlockHighlightedSelector";
import { MultiBlockSelectorConfiguration } from "client/tools/highlighters/MultiBlockSelector";
import { SelectedBlocksHighlighter } from "client/tools/highlighters/SelectedBlocksHighlighter";
import { TutorialConfigBlockHighlight } from "client/tutorial/TutorialConfigTool";
import { Colors } from "shared/Colors";
import { BlockRegistry } from "shared/block/BlockRegistry";
import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { Config } from "shared/config/Config";
import { ObservableCollectionSet } from "shared/event/ObservableCollection";
import { JSON } from "shared/fixes/Json";
import { Objects } from "shared/fixes/objects";
import { VectorUtils } from "shared/utils/VectorUtils";

namespace Scene {
	export type ConfigToolSceneDefinition = GuiObject & {
		readonly ParamsSelection: Frame & {
			readonly Buttons: GuiObject;
			readonly HeaderLabel: TextLabel;
		};
		readonly Bottom: {
			readonly DeselectButton: TextButton;
			readonly ResetButton: TextButton;
		};
	};
	export class ConfigToolScene extends Control<ConfigToolSceneDefinition> {
		constructor(
			gui: ConfigToolSceneDefinition,
			private readonly tool: ConfigTool,
		) {
			super(gui);

			const selected = tool.selected;
			this.event.subscribeCollection(selected, () => {
				this.updateConfigs(selected.getArr());
			});

			this.gui.Bottom.DeselectButton.Activated.Connect(() => {
				tool.unselectAll();
			});

			this.gui.Bottom.ResetButton.Activated.Connect(async () => {
				$log(`Resetting (${selected.get().size()}) block config values`);

				const response = await ClientBuilding.resetConfigOperation.execute(
					tool.targetPlot.get(),
					selected.getArr(),
				);

				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
				}

				this.updateConfigs(selected.getArr());
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

		private currentConfigControl?: MultiConfigControl<BlockConfigTypes.Definitions>;
		private updateConfigs(selected: readonly BlockModel[]) {
			const wasVisible = this.gui.Visible;

			this.gui.Visible = selected.size() !== 0;
			if (!this.gui.Visible) return;

			if (!wasVisible) GuiAnimator.transition(this.gui, 0.2, "up");
			const blockmodel = selected[0];
			const block = BlockRegistry.map.get(BlockManager.manager.id.get(blockmodel))!;
			const onedef = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
				.input as BlockConfigTypes.Definitions;

			this.gui.Visible = Objects.size(onedef) !== 0;
			if (!this.gui.Visible) return;

			this.gui.ParamsSelection.HeaderLabel.Text = `${block.displayName.upper()} x${selected.size()}`;

			const configs = selected.map((selected) => {
				const blockmodel = selected;
				const id = BlockManager.manager.id.get(blockmodel)!;
				const block = BlockRegistry.map.get(id)!;

				const defs = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
					.input as BlockConfigTypes.Definitions;
				if (!defs) return undefined!;

				const config = Config.addDefaults(
					BlockManager.manager.config.get(blockmodel) as Record<string, number>,
					defs,
				);
				return {
					blockmodel,
					uuid: BlockManager.manager.uuid.get(blockmodel),
					config,
					connections: Objects.keys(BlockManager.manager.connections.get(blockmodel)),
				} as const;
			});

			this.currentConfigControl?.destroy();

			const gui = this.gui.ParamsSelection.Buttons.Clone();
			gui.Parent = this.gui.ParamsSelection;
			const configControl = this.add(
				new MultiConfigControl(
					gui,
					Objects.fromEntries(configs.map((c) => [c.uuid, c.config] as const)),
					onedef,
					configs[0].connections,
					Objects.size(configs) === 1 ? configs[0].blockmodel : undefined,
				),
			);
			this.currentConfigControl = configControl;

			configControl.travelToConnectedPressed.Connect((uuid) => {
				this.tool.unselectAll();
				this.tool.selectBlockByUuid(uuid);
			});
			configControl.configUpdated.Connect(async (key, values) => {
				const selected = this.tool.selected.get();
				$log(
					`Sending (${selected.size()}) block config values for ${Objects.keys(values).join()} .${key} ${JSON.serialize(Objects.values(values))}`,
				);

				const response = await ClientBuilding.updateConfigOperation.execute(
					this.tool.targetPlot.get(),
					selected.map(
						(b) =>
							({
								block: b,
								key,
								value: JSON.serialize(values[BlockManager.manager.uuid.get(b)]),
							}) satisfies ConfigUpdateRequest["configs"][number],
					),
				);
				if (!response.success) {
					LogControl.instance.addLine(response.message, Colors.red);
					this.updateConfigs([...selected]);
				}
			});
		}
	}
}

export class ConfigTool extends ToolBase {
	readonly blocksToConfigure: TutorialConfigBlockHighlight[] = [];
	readonly selected = new ObservableCollectionSet<BlockModel>();
	private readonly gui;

	constructor(mode: BuildingMode) {
		super(mode);
		this.gui = this.parentGui(
			new Scene.ConfigToolScene(ToolBase.getToolGui<"Config", Scene.ConfigToolSceneDefinition>().Config, this),
		);

		this.parent(new SelectedBlocksHighlighter(this.selected));

		const canBeSelected = (block: BlockModel): boolean => {
			if (this.blocksToConfigure.size() > 0) {
				if (
					!this.blocksToConfigure.any(
						(value) =>
							VectorUtils.roundVector3(value.position) ===
							VectorUtils.roundVector3(
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

			if (!asMap((config as BlockConfigTypes.BothDefinitions).input).findValue((k, v) => !v.configHidden)) {
				return false;
			}

			return true;
		};
		const canBeSelectedConsideringCurrentSelection = (block: BlockModel): boolean => {
			if (!canBeSelected(block)) {
				return false;
			}

			if (this.selected.size() === 0) {
				return true;
			}

			if (InputController.isShiftPressed() || InputController.inputType.get() === "Touch") {
				const differentId = this.selected
					.get()
					.find((s) => BlockManager.manager.id.get(s) !== BlockManager.manager.id.get(block));
				return differentId === undefined;
			}

			return true;
		};

		const config: MultiBlockSelectorConfiguration = {
			filter: canBeSelectedConsideringCurrentSelection,
			enabled: ["single"],
			/*modeSetMiddleware: (mode, prev) => {
				if (!InputController.isShiftPressed()) {
					if (mode === "assembly" || mode === "machine" || mode === "box") {
						return prev;
					}
				}

				return mode;
			},*/
		};
		this.parent(new MultiBlockHighlightedSelector(mode.targetPlot, this.selected, undefined, config));

		// TODO: remove false later, deselects everything after any change
		if (false as boolean)
			this.subscribeToCurrentPlot((plot) => {
				if (!this.selected.get().find((s) => s.IsDescendantOf(plot.instance))) {
					return;
				}

				this.selected.clear();
			});
	}

	selectBlockByUuid(uuid: BlockUuid) {
		this.selected.push(SharedPlots.getBlockByUuid(this.targetPlot.get().instance, uuid));
	}
	unselectAll() {
		this.selected.clear();
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
