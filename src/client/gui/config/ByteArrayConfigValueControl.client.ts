import { ButtonControl } from "client/gui/controls/Button";
import { MemoryEditorPopup } from "client/gui/popup/MemoryEditorPopup";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type Type = BlockConfigTypes.ByteArray;
class ValueControl extends ConfigValueControl<GuiButton, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.bytearray(), definition.displayName);

		let value = this.sameOrUndefined(configs, (left, right) => {
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

		const control = this.add(
			new ButtonControl(this.gui.Control, () => {
				MemoryEditorPopup.showPopup(definition.lengthLimit, [...(value ?? [])], (newval) => {
					value = newval;
					const prev = configs;
					this._submitted.Fire((configs = this.map(configs, () => newval)), prev);
				});
			}),
		);

		if (!value) {
			control.setInteractable(false);
		}
	}
}

configControlRegistry.set("bytearray", ValueControl);
