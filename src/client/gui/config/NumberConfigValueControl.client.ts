import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import BlockConfigDefinitionRegistry, { BlockConfigRegToDefinition } from "shared/BlockConfigDefinitionRegistry";
import NumberTextBoxControl, { NumberTextBoxControlDefinition } from "../controls/NumberTextBoxControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ConfigNumberControl extends Control<NumberTextBoxControlDefinition> {
	readonly submitted;

	constructor(gui: NumberTextBoxControlDefinition, def: number | undefined) {
		super(gui);

		const cb = this.add(new NumberTextBoxControl<number | undefined>(gui));
		this.submitted = cb.submitted;

		cb.value.set(def);
		// TODO: def
	}
}

class NumberConfigValueControl extends ConfigValueControl<NumberTextBoxControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry["number"]["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry["number"]["config"]>>,
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry["number"]>,
	) {
		super(configValueTemplateStorage.number(), definition.displayName);

		const control = this.add(new ConfigNumberControl(this.gui.Control, this.sameOrUndefined(configs)));
		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire((configs = this.map(configs, () => value))),
		);
	}
}

configControlRegistry.set("number", NumberConfigValueControl);
