import { UserInputService } from "@rbxts/services";
import BlockConfig from "client/blocks/BlockConfig";
import Objects from "shared/_fixes_/objects";
import BlockLogic from "./BlockLogic";
import { KeyPressingConflictingController } from "./KeyPressingController";

type KeyMembers<TDef extends ConfigDefinitions> = ExtractKeys<TDef, { type: "key" }> & string;
export type KeyDefinition<TDef extends ConfigDefinitions> = {
	keyDown?: () => void;
	keyUp?: () => void;
	conflicts?: KeyMembers<TDef>;
};
export type KeyDefinitions<TDef extends ConfigDefinitions> = Partial<Record<KeyMembers<TDef>, KeyDefinition<TDef>>>;

export default abstract class ConfigurableBlockLogic<TDef extends ConfigDefinitions> extends BlockLogic {
	protected readonly keysDefinition;
	public readonly config: BlockConfig<TDef>;
	private readonly btnmap;
	private readonly keyController;

	constructor(block: Model, configDefinition: TDef) {
		super(block);

		this.config = new BlockConfig<TDef>(block, configDefinition);
		this.keysDefinition = this.getKeysDefinition();
		this.keyController = new KeyPressingConflictingController<KeyMembers<TDef>>(this.keysDefinition);

		this.btnmap = new Map<KeyCode, KeyMembers<TDef>>(
			Objects.entries(this.keysDefinition).map((d) => [this.config.get(d[0]) as KeyCode, d[0]] as const),
		);

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

	triggerKeyDown(key: KeyMembers<TDef>) {
		if (!this.machine?.seat.occupiedByLocalPlayer.get()) return;
		this.keyController.keyDown(key);
	}
	triggerKeyUp(key: KeyMembers<TDef>) {
		if (!this.machine?.seat.occupiedByLocalPlayer.get()) return;
		this.keyController.keyUp(key);
	}

	getKeysDefinition(): KeyDefinitions<TDef> {
		return {};
	}
}
