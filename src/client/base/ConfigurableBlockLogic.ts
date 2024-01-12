import { UserInputService } from "@rbxts/services";
import blockConfigRegistryClient, { ConfigLogicValueBase } from "client/blocks/BlockConfigRegistryClient";
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
import { KeyPressingConflictingController } from "./KeyPressingController";

type KeyMembers<TDef extends BlockConfigDefinitions> = ExtractKeys<TDef, { type: "key" | "keybool" }> & string;
export type KeyDefinition<TDef extends BlockConfigDefinitions> = {
	keyDown?: () => void;
	keyUp?: () => void;
	conflicts?: KeyMembers<TDef>;
};
export type KeyDefinitions<TDef extends BlockConfigDefinitions> = Partial<
	Record<KeyMembers<TDef>, KeyDefinition<TDef>>
>;

export default abstract class ConfigurableBlockLogic<TDef extends BlockConfigBothDefinitions> extends BlockLogic {
	readonly config: BlockConfigDefinitionsToConfig<TDef["input"]>;
	readonly input: {
		readonly [k in keyof TDef["input"]]: ConfigLogicValueBase<TDef["input"][k]>;
	};
	readonly output: {
		readonly [k in keyof TDef["output"]]: ObservableValue<TDef["output"][k]["default"]>;
	};
	protected readonly keysDefinition;
	private readonly btnmap;
	private readonly keyController;

	constructor(block: PlacedBlockData, configDefinition: TDef) {
		super(block);

		this.config = BlockConfig.deserialize(this.block, configDefinition.input);

		const createInput = (key: string, definition: BlockConfigDefinition) => {
			return this.added(
				new blockConfigRegistryClient[definition.type].input(
					this.config[key] as never,
					definition as never,
					false,
				),
			);
		};

		this.input = Objects.fromEntries(
			Objects.entries(configDefinition.input).map((d) => [d[0], createInput(d[0], d[1])] as const),
		) as typeof this.input;

		this.output = Objects.fromEntries(
			Objects.entries(configDefinition.output).map(
				(d) => [d[0], blockConfigRegistryClient[d[1].type].output(d[1] as never)] as const,
			),
		) as typeof this.output;

		this.keysDefinition = this.getKeysDefinition();
		this.keyController = new KeyPressingConflictingController<KeyMembers<TDef["input"]>>(this.keysDefinition);

		this.btnmap = new Map<KeyCode, KeyMembers<TDef["input"]>>();

		this.event.onPrepare(() => {
			this.eventHandler.subscribe(this.machine!.seat.occupiedByLocalPlayer.changed, (occupied) => {
				if (occupied) return;
				this.keyController.releaseAll();
			});
		});

		this.event.subscribe(this.keyController.onKeyDown, (key) => {
			this.keysDefinition[key]?.keyDown?.();
		});
		this.event.subscribe(this.keyController.onKeyUp, (key) => {
			this.keysDefinition[key]?.keyUp?.();
		});

		this.event.subscribe(UserInputService.InputBegan, (input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

			this.tryTriggerKeycodeDown(input.KeyCode.Name);
		});
		this.event.subscribe(UserInputService.InputEnded, (input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

			this.tryTriggerKeycodeUp(input.KeyCode.Name);
		});
	}

	tryTriggerKeycodeDown(key: KeyCode) {
		const btnmap = this.btnmap.get(key);
		if (btnmap === undefined) return;

		this.triggerKeyDown(btnmap);
	}
	tryTriggerKeycodeUp(key: KeyCode) {
		const btnmap = this.btnmap.get(key);
		if (btnmap === undefined) return;

		this.triggerKeyUp(btnmap);
	}

	triggerKeyDown(key: KeyMembers<TDef["input"]>) {
		if (!this.machine?.seat.occupiedByLocalPlayer.get()) return;
		this.keyController.keyDown(key);
	}
	triggerKeyUp(key: KeyMembers<TDef["input"]>) {
		if (!this.machine?.seat.occupiedByLocalPlayer.get()) return;
		this.keyController.keyUp(key);
	}

	getKeysDefinition(): KeyDefinitions<TDef["input"]> {
		return {};
	}
}
