import { Control } from "client/gui/Control";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type MultiConfigControlDefinition = GuiObject;
type ConfigUpdatedCallback<TDef extends BlockConfigTypes.Definitions, TKey extends keyof TDef & string> = (
	key: TKey,
	values: Readonly<Record<BlockUuid, TDef[TKey]["config"]>>,
) => void;

export class MultiConfigControl<
	TDef extends BlockConfigTypes.Definitions,
> extends Control<MultiConfigControlDefinition> {
	readonly configUpdated = new Signal<ConfigUpdatedCallback<TDef, keyof TDef & string>>();

	constructor(
		gui: MultiConfigControlDefinition,
		configs: Readonly<Record<BlockUuid, ConfigDefinitionsToConfig<keyof TDef, TDef>>>,
		definition: Partial<TDef>,
		connected: readonly (keyof TDef)[] = [],
	) {
		super(gui);

		for (const [id, def] of Objects.pairs_(definition)) {
			if (def.configHidden) continue;
			if (connected.includes(id)) {
				this.add(new ConfigValueControl(configValueTemplateStorage.connected(), def.displayName));
				continue;
			}

			const control = new configControlRegistry[def.type]({
				configs: Objects.fromEntries(
					Objects.entriesArray(configs).map((e) => [e[0], e[1][id]] as const),
				) as never,
				definition: def as never,
			});
			this.add(control);

			control.submitted.Connect((values) =>
				this.configUpdated.Fire(
					id as string,
					values as Readonly<Record<BlockUuid, TDef[keyof TDef]["config"]>>,
				),
			);
		}
	}
}
