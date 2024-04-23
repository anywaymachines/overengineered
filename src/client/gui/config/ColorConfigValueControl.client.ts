import { ColorChooser, ColorChooserDefinition } from "client/gui/ColorChooser";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class ColorConfigValueControl extends ConfigValueControl<ColorChooserDefinition> {
	readonly submitted = new Signal<(config: Readonly<Record<BlockUuid, BlockConfigTypes.Color["config"]>>) => void>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.Color["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.Color>,
	) {
		super(configValueTemplateStorage.color(), definition.displayName);

		const control = this.add(new ColorChooser(this.gui.Control));
		control.value.set(this.sameOrUndefined(configs) ?? Color3.fromRGB(255, 255, 255));

		this.event.subscribe(control.submitted, (value) =>
			this.submitted.Fire((configs = this.map(configs, () => value))),
		);
	}
}

configControlRegistry.set("color", ColorConfigValueControl);
