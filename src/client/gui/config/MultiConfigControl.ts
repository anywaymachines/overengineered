import { Control } from "client/gui/Control";
import { Signal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type PartialIfObject<T> = T extends CheckableTypes[Exclude<keyof CheckableTypes, keyof CheckablePrimitives>]
	? T
	: Partial<T>;

type MultiConfigControlDefinition = GuiObject;
type ConfigUpdatedCallback<TDef extends BlockConfigTypes.Definitions, TKey extends keyof TDef> = (
	key: TKey,
	value: Readonly<Record<BlockUuid, PartialIfObject<TDef[TKey]["config"]>>>,
) => void;

export class MultiConfigControl<
	TDef extends BlockConfigTypes.Definitions,
> extends Control<MultiConfigControlDefinition> {
	readonly configUpdated = new Signal<ConfigUpdatedCallback<TDef, keyof TDef>>();

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

			const control = new configControlRegistry[def.type](
				Objects.fromEntries(Objects.entriesArray(configs).map((e) => [e[0], e[1][id]] as const)) as never,
				def as never,
			);
			this.add(control);

			control.submitted.Connect((value) =>
				this.configUpdated.Fire(
					id as string,
					value as Readonly<Record<BlockUuid, PartialIfObject<TDef[keyof TDef]["config"]>>>,
				),
			);
		}
	}
}
