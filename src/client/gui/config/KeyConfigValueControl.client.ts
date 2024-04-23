import { KeyChooserControl, KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import { Signal } from "shared/event/Signal";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

class KeyConfigValueControl extends ConfigValueControl<KeyChooserControlDefinition> {
	readonly submitted = new Signal<
		(
			config: Readonly<Record<BlockUuid, BlockConfigTypes.Key["config"]>>,
			prev: Readonly<Record<BlockUuid, BlockConfigTypes.Key["config"]>>,
		) => void
	>();
	readonly value;

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.Key["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.Key>,
	) {
		super(configValueTemplateStorage.key(), definition.displayName);

		const control = this.add(new KeyChooserControl<true>(this.gui.Control));
		this.value = control.value;

		control.value.set(this.sameOrUndefined(configs));
		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;
			this.submitted.Fire((configs = this.map(configs, () => value)), prev);
		});
	}
}
export type { KeyConfigValueControl };

configControlRegistry.set("key", KeyConfigValueControl);
