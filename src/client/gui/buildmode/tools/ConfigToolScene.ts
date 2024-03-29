import { Colors } from "client/gui/Colors";
import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import ConfigControl, { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import LogControl from "client/gui/static/LogControl";
import ConfigTool from "client/tools/ConfigTool";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Remotes from "shared/Remotes";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import BlockManager from "shared/building/BlockManager";
import { Config } from "shared/config/Config";
import ObservableValue from "shared/event/ObservableValue";
import JSON from "shared/fixes/Json";
import Objects from "shared/fixes/objects";

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

export default class ConfigToolScene extends Control<ConfigToolSceneDefinition> {
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

			const response = await Remotes.Client.GetNamespace("Building")
				.Get("UpdateConfigRequest")
				.CallServerAsync({
					plot: tool.targetPlot.get().instance,
					configs: selected
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
				});
			if (!response.success) {
				LogControl.instance.addLine(response.message, Colors.red);
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

			const response = await Remotes.Client.GetNamespace("Building")
				.Get("ResetConfigRequest")
				.CallServerAsync({
					plot: tool.targetPlot.get().instance,
					blocks: selected.get().map((p) => p.Parent),
				});

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
		const block = blockRegistry.get(BlockManager.manager.id.get(blockmodel))!;
		const onedef = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
			.input as BlockConfigTypes.Definitions;

		this.gui.Visible = Objects.keys(onedef).size() !== 0;
		if (!this.gui.Visible) return;

		this.gui.ParamsSelection.HeaderLabel.Text = `CONFIGURATION (${selected.size()})`;

		const configs = selected
			.map((selected) => {
				const blockmodel = selected.Parent;
				const block = blockRegistry.get(BlockManager.manager.id.get(blockmodel))!;

				const defs = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
					.input as BlockConfigTypes.Definitions;
				if (!defs) return undefined!;

				const config = Config.addDefaults(
					BlockManager.manager.config.get(blockmodel) as Record<string, number>,
					defs,
				);
				return [blockmodel, config, Objects.keys(BlockManager.manager.connections.get(blockmodel))] as const;
			})
			.filter((x) => x !== undefined);

		this.configControl.set(configs[0][1], onedef, configs[0][2], configs[0][0]);
	}
}
