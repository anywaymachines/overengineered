import { ButtonControl } from "client/gui/controls/Button";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type Type = BlockConfigTypes.ByteArray;
class ValueControl extends ConfigValueControl<GuiButton, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.bytearray(), definition.displayName);

		const control = this.add(
			new ButtonControl(this.gui.Control, () => {
				// TODO: open popup
				// and then
				// const prev = configs;
				// this._submitted.Fire((configs = this.map(configs, () => value)), prev);
			}),
		);
		const value = this.sameOrUndefined(configs, (left, right) => {
			if (left.size() !== right.size()) {
				return false;
			}

			for (let i = 0; i < left.size(); i++) {
				if (left[i] !== right[i]) {
					return false;
				}
			}

			return true;
		});

		if (!value) {
			control.setInteractable(false);
		}
	}
}

configControlRegistry.set("bytearray", ValueControl);
