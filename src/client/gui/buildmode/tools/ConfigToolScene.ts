import Control from "client/gui/Control";
import GuiAnimator from "client/gui/GuiAnimator";
import ConfigControl, { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import ConfigTool from "client/tools/ConfigTool";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Remotes from "shared/Remotes";
import BlockConfig from "shared/block/config/BlockConfig";
import { BlockConfigDefinitions } from "shared/block/config/BlockConfigDefinitionRegistry";
import blockConfigRegistry from "shared/block/config/BlockConfigRegistry";
import BlockManager from "shared/building/BlockManager";
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

		this.configControl = this.added(new ConfigControl(this.gui.ParamsSelection.Buttons));

		const selected = ObservableValue.fromSignal(tool.selectedBlocksChanged, []);
		this.event.subscribe(this.configControl.configUpdated, async (key, value) => {
			Logger.info(`Sending (${selected.get().size()}) block config values ${key} ${JSON.serialize(value)}`);

			await Remotes.Client.GetNamespace("Building")
				.Get("UpdateConfigRequest")
				.CallServerAsync({
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
		});

		tool.selectedBlocksChanged.Connect((selected) => {
			this.updateConfigs(selected);
		});

		this.gui.Bottom.DeselectButton.Activated.Connect(() => {
			tool.unselectAll();
		});

		this.onPrepare((inputType) => {
			this.gui.Bottom.DeselectButton.Visible = inputType !== "Gamepad";
		});
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.ParamsSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.Bottom.DeselectButton, 0.22, "down");

		this.updateConfigs([]);
	}

	private updateConfigs(selected: readonly (SelectionBox & { Parent: BlockModel })[]) {
		this.gui.Visible = selected.size() !== 0;
		if (!this.gui.Visible) return;

		const blockmodel = selected[0].Parent;
		const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;
		const onedef = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
			.input as BlockConfigDefinitions;

		this.gui.Visible = Objects.keys(onedef).size() !== 0;
		if (!this.gui.Visible) return;

		this.gui.ParamsSelection.HeaderLabel.Text = `CONFIGURATION (${selected.size()})`;

		const configs = selected
			.map((selected) => {
				const blockmodel = selected.Parent;
				const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;

				const defs = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
					.input as BlockConfigDefinitions;
				if (!defs) return undefined!;

				const jsonstr = (blockmodel.GetAttribute("config") as string | undefined) ?? "{}";
				const config = BlockConfig.addDefaults(JSON.deserialize<Record<string, number>>(jsonstr), defs);

				return [
					blockmodel,
					config,
					Objects.keys(BlockManager.getBlockDataByBlockModel(blockmodel).connections),
				] as const;
			})
			.filter((x) => x !== undefined);

		this.configControl.set(configs[0][1], onedef, configs[0][2]);
	}
}
