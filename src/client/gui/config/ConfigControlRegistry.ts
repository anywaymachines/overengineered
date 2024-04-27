import { type ConfigValueControl, type ConfigValueControlParams } from "./ConfigValueControl";

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
