import Signal from "@rbxts/signal";
import BlockConfigDefinitionRegistry, { BlockConfigRegToDefinition } from "shared/block/config/BlockConfigDefinitionRegistry";
import CheckBoxControl, { CheckBoxControlDefinition } from "../controls/CheckBoxControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class BoolConfigValueControl extends ConfigValueControl<CheckBoxControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry["bool"]["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry["bool"]["config"]>>,
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["bool"]>,
	) {
		super(configValueTemplateStorage.checkbox(), definition.displayName);

		const control = this.add(new CheckBoxControl(this.gui.Control));
		control.value.set(this.sameOrUndefined(configs));
		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire((configs = this.map(configs, () => value))),
		);
	}
}

configControlRegistry.set("bool", BoolConfigValueControl);
