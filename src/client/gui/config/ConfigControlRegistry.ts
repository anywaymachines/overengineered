import type { ConfigValueControl, ConfigValueControlParams } from "client/gui/config/ConfigValueControl";

type Ctor<TKey extends keyof BlockConfigTypes.Types> = {
	new (
		params: ConfigValueControlParams<BlockConfigTypes.Types[TKey]>,
	): ConfigValueControl<GuiObject, BlockConfigTypes.Types[TKey]>;
};

type ConfigControlRegistry = {
	readonly [k in keyof BlockConfigTypes.Types]: Ctor<k>;
} & {
	set<TKey extends keyof BlockConfigTypes.Types>(key: TKey, value: Ctor<TKey>): void;
};

export const configControlRegistry: ConfigControlRegistry = {
	set<TKey extends keyof BlockConfigTypes.Types>(key: TKey, value: Ctor<TKey>): void {
		(this as Writable<ConfigControlRegistry>)[key] = value as never;
	},
} as ConfigControlRegistry;
