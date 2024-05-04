import { ByteEditor, ByteEditorDefinition } from "client/gui/controls/ByteEditorControl";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type Type = BlockConfigTypes.Byte;
class ValueControl extends ConfigValueControl<ByteEditorDefinition, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.byte(), definition.displayName);

		// TODO: Mixed values
		const control = this.add(new ByteEditor(this.gui.Control));
		control.value.set(this.sameOrUndefined(this.map(configs, (c) => c.value)) ?? 0);
		this.event.subscribe(control.submitted, (value) => {
			const prev = configs;
			this._submitted.Fire((configs = this.map(configs, () => ({ type: "byte", value }))), prev);
		});
	}
}

configControlRegistry.set("byte", ValueControl);
