import Signal from "@rbxts/signal";
import Control from "client/base/Control";
import { BlockConfigDefinitions, BlockConfigDefinitionsToConfig } from "shared/BlockConfigDefinitionRegistry";
import Objects from "shared/fixes/objects";
import { configControlRegistry } from "./ConfigControlRegistry";
import { ConfigValueControl } from "./ConfigValueControl";
import { configValueTemplateStorage } from "./ConfigValueTemplateStorage";

type PartialIfObject<T> = T extends CheckableTypes[Exclude<keyof CheckableTypes, keyof CheckablePrimitives>]
	? T
	: Partial<T>;

type MultiConfigControlDefinition = GuiObject;
type ConfigUpdatedCallback<TDef extends BlockConfigDefinitions, TKey extends keyof TDef> = (
	key: TKey,
	value: Readonly<Record<BlockUuid, PartialIfObject<TDef[TKey]["config"]>>>,
) => void;

export default class MultiConfigControl<
	TDef extends BlockConfigDefinitions,
> extends Control<MultiConfigControlDefinition> {
	readonly configUpdated = new Signal<ConfigUpdatedCallback<TDef, keyof TDef>>();

	constructor(
		gui: MultiConfigControlDefinition,
		configs: Readonly<Record<BlockUuid, BlockConfigDefinitionsToConfig<TDef>>>,
		definition: Partial<TDef>,
		connected: readonly (keyof TDef)[] = [],
	) {
		super(gui);

		for (const [id, def] of Objects.pairs(definition)) {
			if (def.configHidden) continue;
			if (connected.includes(id)) {
				this.add(new ConfigValueControl(configValueTemplateStorage.connected(), def.displayName));
				continue;
			}

			const control = new configControlRegistry[def.type](
				Objects.fromEntries(Objects.entries(configs).map((e) => [e[0], e[1][id]] as const)) as never,
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
