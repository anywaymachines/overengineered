import Signal from "@rbxts/signal";
import TextBoxControl, { TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";
import BlockConfigDefinitionRegistry, {
	BlockConfigRegToDefinition,
} from "shared/block/config/BlockConfigDefinitionRegistry";
import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";

class StringConfigValueControl extends ConfigValueControl<TextBoxControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry["string"]["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry["string"]["config"]>>,
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["string"]>,
	) {
		super(configValueTemplateStorage.string(), definition.displayName);

		const control = this.add(new TextBoxControl(this.gui.Control));
		control.text.set(this.sameOrUndefined(configs) ?? "");

		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire((configs = this.map(configs, () => value))),
		);
	}
}

configControlRegistry.set("string", StringConfigValueControl);
