import { configControlRegistry } from "client/gui/config/ConfigControlRegistry";
import { ConfigValueControl } from "client/gui/config/ConfigValueControl";
import { configValueTemplateStorage } from "client/gui/config/ConfigValueTemplateStorage";
import { KeyChooserControl } from "client/gui/controls/KeyChooserControl";
import { ObservableValue } from "shared/event/ObservableValue";
import type { ConfigValueControlParams } from "client/gui/config/ConfigValueControl";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";

type Type = BlockConfigTypes.Key;
class ValueControl extends ConfigValueControl<KeyChooserControlDefinition, Type> {
	readonly values = new ObservableValue<Readonly<Record<BlockUuid, string>>>({});

	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.key(), definition.displayName);

		const control = this.add(new KeyChooserControl<true>(this.gui.Control));
		this.values.set(configs);
		this.event.subscribeObservable(this.values, (values) =>
			control.value.set(this.sameOrUndefined((configs = values))),
		);

		control.value.set(this.sameOrUndefined(configs));
		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;

			configs = this.map(configs, () => value);
			this.values.set(configs);
			this._submitted.Fire(configs, prev);
		});
	}
}
export type { ValueControl as KeyConfigValueControl };

configControlRegistry.set("key", ValueControl);
