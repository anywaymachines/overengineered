import Control from "client/base/Control";
import ConfigTool from "client/tools/ConfigTool";
import BlockConfig from "shared/BlockConfig";
import { BlockConfigDefinitions } from "shared/BlockConfigDefinitionRegistry";
import blockConfigRegistry from "shared/BlockConfigRegistry";
import Logger from "shared/Logger";
import { blockRegistry } from "shared/Registry";
import Remotes from "shared/Remotes";
import JSON from "shared/_fixes_/Json";
import ObservableValue from "shared/event/ObservableValue";
import GuiAnimator from "../../GuiAnimator";
import ConfigControl, { ConfigControlDefinition } from "../ConfigControl";

export type ConfigToolSceneDefinition = GuiObject & {
	ParamsSelection: Frame & {
		Buttons: ConfigControlDefinition;
		Title: GuiObject & {
			HeadingLabel: TextLabel;
		};
	};
	DeselectAllButton: TextButton;
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
					blocks: selected.get().map((p) => p.Parent),
					data: { key, value: JSON.serialize(value) },
				});
		});

		tool.selectedBlocksChanged.Connect((selected) => {
			this.updateConfigs(selected);
		});

		this.gui.DeselectAllButton.Activated.Connect(() => {
			tool.unselectAll();
		});

		this.event.onPrepare((inputType) => {
			this.gui.DeselectAllButton.Visible = inputType !== "Gamepad";
		}, true);
	}

	public show() {
		super.show();

		GuiAnimator.transition(this.gui.ParamsSelection, 0.2, "right");
		GuiAnimator.transition(this.gui.DeselectAllButton, 0.22, "down");

		this.updateConfigs([]);
	}

	private updateConfigs(selected: readonly (SelectionBox & { Parent: BlockModel })[]) {
		if (selected.size() === 0) return;

		this.gui.ParamsSelection.Title.HeadingLabel.Text = `CONFIGURATION (${selected.size()})`;

		const configs = selected
			.map((selected) => {
				const blockmodel = selected.Parent;
				const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;

				const defs = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
					.input as BlockConfigDefinitions;
				if (!defs) return undefined!;

				const jsonstr = (blockmodel.GetAttribute("config") as string | undefined) ?? "{}";
				const config = BlockConfig.addDefaults(JSON.deserialize<Record<string, number>>(jsonstr), defs);

				return [blockmodel, config] as const;
			})
			.filter((x) => x !== undefined);

		const blockmodel = selected[0].Parent;
		const block = blockRegistry.get(blockmodel.GetAttribute("id") as string)!;
		const onedef = blockConfigRegistry[block.id as keyof typeof blockConfigRegistry]
			.input as BlockConfigDefinitions;

		this.configControl.set(configs[0][1], onedef);
	}
}
