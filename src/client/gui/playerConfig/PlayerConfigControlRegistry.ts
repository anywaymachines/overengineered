import { ReadonlySignal } from "shared/event/Signal";
import { ConfigValueControl } from "./ConfigValueControl";

export interface ConfigControl<TKey extends keyof PlayerConfigTypes.Types> extends ConfigValueControl<GuiObject> {
	readonly submitted: ReadonlySignal<(config: PlayerConfigTypes.Types[TKey]["config"]) => void>;
}
type Ctor<TKey extends keyof PlayerConfigTypes.Types> = {
	new (
		config: PlayerConfigTypes.Types[TKey]["config"] & defined,
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Types[TKey]>,
	): ConfigControl<TKey>;
};

type PlayerConfigControlRegistry = {
	readonly [k in keyof PlayerConfigTypes.Types]: Ctor<k>;
} & {
	set<TKey extends keyof PlayerConfigTypes.Types>(key: TKey, value: Ctor<TKey>): void;
};

export const playerConfigControlRegistry: PlayerConfigControlRegistry = {
	set<TKey extends keyof PlayerConfigTypes.Types>(key: TKey, value: Ctor<TKey>): void {
		(this as Writable<PlayerConfigControlRegistry>)[key] = value as PlayerConfigControlRegistry[TKey];
	},
} as PlayerConfigControlRegistry;
