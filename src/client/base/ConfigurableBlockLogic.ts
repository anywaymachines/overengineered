import blockConfigRegistryClient from "client/blocks/config/BlockConfigRegistryClient";
import { ConfigLogicValueBase } from "client/blocks/config/ConfigLogicValueBase";
import BlockConfig from "shared/BlockConfig";
import {
	BlockConfigBothDefinitions,
	BlockConfigDefinition,
	BlockConfigDefinitions,
	BlockConfigDefinitionsToConfig,
} from "shared/BlockConfigDefinitionRegistry";
import Objects from "shared/_fixes_/objects";
import { PlacedBlockData } from "shared/building/BlockManager";
import ObservableValue from "shared/event/ObservableValue";
import BlockLogic from "./BlockLogic";

type KeyMembers<TDef extends BlockConfigDefinitions> = ExtractKeys<TDef, { type: "key" | "keybool" }> & KeyCode;
export type KeyDefinition<TDef extends BlockConfigDefinitions> = {
	keyDown?: () => void;
	keyUp?: () => void;
	conflicts?: KeyMembers<TDef>;
};
export type KeyDefinitions<TDef extends BlockConfigDefinitions> = Partial<
	Record<KeyMembers<TDef>, KeyDefinition<TDef>>
>;

export default abstract class ConfigurableBlockLogic<
	TDef extends BlockConfigBothDefinitions,
	T extends BlockModel = BlockModel,
> extends BlockLogic<T> {
	readonly config: BlockConfigDefinitionsToConfig<TDef["input"]>;
	readonly input: {
		readonly [k in keyof TDef["input"]]: ConfigLogicValueBase<TDef["input"][k]>;
	};
	readonly output: {
		readonly [k in keyof TDef["output"]]: ObservableValue<TDef["output"][k]["default"]>;
	};

	constructor(block: PlacedBlockData, configDefinition: TDef) {
		super(block);

		this.config = BlockConfig.deserialize(this.block, configDefinition.input);

		const controlsEnabled = new ObservableValue(false);
		const createInput = (key: string, definition: BlockConfigDefinition) => {
			return this.added(
				new blockConfigRegistryClient[definition.type].input(
					this.config[key] as never,
					definition as never,
					block.connections[key as keyof typeof block.connections] !== undefined,
					controlsEnabled,
				),
			);
		};
		this.event.onPrepare(() => {
			this.eventHandler.subscribe(this.machine!.seat.occupiedByLocalPlayer.changed, (occupied) =>
				controlsEnabled.set(occupied),
			);
		});

		this.input = Objects.fromEntries(
			Objects.entries(configDefinition.input).map((d) => [d[0], createInput(d[0], d[1])] as const),
		) as typeof this.input;

		this.output = Objects.fromEntries(
			Objects.entries(configDefinition.output).map(
				(d) => [d[0], blockConfigRegistryClient[d[1].type].output(d[1] as never)] as const,
			),
		) as typeof this.output;
	}

	tryTriggerKeycodeDown(key: KeyCode) {}
	tryTriggerKeycodeUp(key: KeyCode) {}

	getKeysDefinition(): KeyDefinitions<TDef["input"]> {
		return {};
	}
}
