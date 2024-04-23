import { ConfigControlDefinition } from "client/gui/buildmode/ConfigControl";
import { type KeyConfigValueControl } from "client/gui/config/KeyConfigValueControl.client";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type MultiKeyConfigValueControlDefinition = ConfigControlDefinition;
class MultiKeyConfigValueControl extends ConfigValueControl<MultiKeyConfigValueControlDefinition> {
	readonly submitted = new Signal<
		(config: Readonly<Record<BlockUuid, BlockConfigTypes.MultiKey["config"]>>) => void
	>();

	constructor(
		configs: Readonly<Record<BlockUuid, BlockConfigTypes.MultiKey["config"]>>,
		definition: ConfigTypeToDefinition<BlockConfigTypes.MultiKey>,
	) {
		super(configValueTemplateStorage.multi(), definition.displayName);

		const list = this.add(new DictionaryControl<GuiObject, string, KeyConfigValueControl>(this.gui.Control));
		for (const [name, _] of Objects.pairs_(definition.default)) {
			const cfgs = Objects.fromEntries(
				Objects.entriesArray(configs).map(([uuid, config]) => [uuid, config[name]]),
			);

			const control = new configControlRegistry.key(
				cfgs,
				definition.keyDefinitions[name],
			) as unknown as KeyConfigValueControl;
			list.keyedChildren.add(name, control);

			this.event.subscribe(control.submitted, (value, prev) => {
				const changed: (keyof (typeof configs)[BlockUuid])[] = [name];
				const val = Objects.firstValue(value);
				const prevval = Objects.firstValue(prev);

				for (const [key, child] of list.keyedChildren.getAll()) {
					if (child === control) continue;

					if (child.value.get() === val) {
						child.value.set(prevval);
						changed.push(key);
					}
				}

				const update = Objects.fromEntries(
					changed.map((c) => [c, list.keyedChildren.get(c)!.value.get()!] as const),
				);
				configs = this.map(configs, (c) => ({ ...c, ...update }));

				this.submitted.Fire(configs);
			});
		}
	}
}

configControlRegistry.set("multikey", MultiKeyConfigValueControl);
