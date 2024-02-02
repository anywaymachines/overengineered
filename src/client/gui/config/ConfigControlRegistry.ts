import Signal from "@rbxts/signal";
import BlockConfigDefinitionRegistry, { BlockConfigRegToDefinition } from "shared/block/config/BlockConfigDefinitionRegistry";
import { ConfigValueControl } from "./ConfigValueControl";

type Ctor<TKey extends keyof BlockConfigDefinitionRegistry> = {
	new (
		configs: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry[TKey]["config"]>>,
		definition: BlockConfigRegToDefinition<BlockConfigDefinitionRegistry[TKey]>,
	): ConfigValueControl<GuiObject> & {
		readonly submitted: Signal<
			(config: Readonly<Record<BlockUuid, BlockConfigDefinitionRegistry[TKey]["config"]>>) => void
		>;
	};
};

type ConfigControlRegistry = {
	readonly [k in keyof BlockConfigDefinitionRegistry]: Ctor<k>;
} & {
	set<TKey extends keyof BlockConfigDefinitionRegistry>(key: TKey, value: Ctor<TKey>): void;
};

export const configControlRegistry: ConfigControlRegistry = {
	set<TKey extends keyof BlockConfigDefinitionRegistry>(key: TKey, value: Ctor<TKey>): void {
		(this as Writable<ConfigControlRegistry>)[key] = value as ConfigControlRegistry[TKey];
	},
} as ConfigControlRegistry;
