import { type KeyConfigValueControl } from "client/gui/config/KeyConfigValueControl.client";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { JSON } from "shared/fixes/Json";
import { Objects, asMap } from "shared/fixes/objects";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl, ConfigValueControlParams } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type Type = BlockConfigTypes.MultiKey;
class ValueControl extends ConfigValueControl<GuiObject, Type> {
	constructor({ configs, definition }: ConfigValueControlParams<Type>) {
		super(configValueTemplateStorage.multi(), definition.displayName);

		if (Objects.size(definition.keyDefinitions) !== 2) {
			throw "Unsupported keydef size";
		}

		const list = this.add(new DictionaryControl<GuiObject, string, KeyConfigValueControl>(this.gui.Control));
		for (const [name, _] of Objects.pairs_(definition.default)) {
			const cfgs = Objects.fromEntries(
				Objects.entriesArray(configs).map(([uuid, config]) => [uuid, config[name]]),
			);

			const control = new configControlRegistry.key({
				configs: cfgs,
				definition: definition.keyDefinitions[name],
			}) as KeyConfigValueControl;
			list.keyedChildren.add(name, control);

			this.event.subscribe(control.submitted, (value, prev) => {
				const changed: (keyof (typeof configs)[BlockUuid])[] = [name];
				const newvalue = Objects.firstValue(value)!;
				const prevval = asMap(prev).findValue((p) => p !== newvalue);
				if (prevval === undefined) {
					throw "what";
				}

				for (const [key, child] of list.keyedChildren.getAll()) {
					if (child === control) continue;

					for (const [, value] of Objects.pairs_(child.values.get())) {
						if (newvalue === value) {
							child.values.set(this.map(configs, () => prevval));
							print("setting mega cvhild values", JSON.serialize(child.values.get()));
							changed.push(key);
							break;
						}
					}
				}

				const thisprev = configs;
				const update = Objects.fromEntries(
					changed.map((c) => [c, Objects.firstValue(list.keyedChildren.get(c)!.values.get()!)!] as const),
				);
				configs = this.map(configs, (c) => ({ ...c, ...update }));
				this._submitted.Fire(configs, thisprev);
			});
		}
	}
}

configControlRegistry.set("multikey", ValueControl);
