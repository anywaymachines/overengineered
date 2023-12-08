import { UserInputService } from "@rbxts/services";
import { BlockConfig } from "client/blocks/BlockConfig";
import Objects from "shared/_fixes_/objects";
import BlockLogic from "./BlockLogic";

export type KeyDefinition = {
	keyDown?: () => void;
	keyUp?: () => void;
};
export type KeyDefinitions<TConfig extends ConfigValueTypes> = Partial<
	Record<keyof ExtractMembers<TConfig, "key">, KeyDefinition>
>;

export default abstract class ConfigurableBlockLogic<TConfig extends ConfigValueTypes> extends BlockLogic {
	protected readonly keysDefinition;
	public readonly config: BlockConfig<TConfig>;

	constructor(block: Model) {
		super(block);

		this.config = new BlockConfig<TConfig>(block, this.getConfigDefinition());
		this.keysDefinition = this.getKeysDefinition();

		// input event handlers
		type configKeyKeys = ConfigTypesToConfig<ExtractMembers<TConfig, "key">>[keyof ExtractMembers<TConfig, "key">];
		const btnmap = new Map<configKeyKeys, KeyDefinition>(
			Objects.entries(this.keysDefinition).map((d) => [this.config.get(d[0]), d[1]] as const),
		);

		this.event.subscribe(UserInputService.InputBegan, (input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

			const key = input.KeyCode.Name as keyof typeof btnmap;
			if (!(key in btnmap)) return;

			this.keyPressed(key as KeyCode);
			btnmap.get(key as configKeyKeys)?.keyDown?.();
		});

		this.event.subscribe(UserInputService.InputEnded, (input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;

			const key = input.KeyCode.Name as keyof typeof btnmap;
			if (!(key in btnmap)) return;

			this.keyPressed(key as KeyCode);
			btnmap.get(key as configKeyKeys)?.keyUp?.();
		});
	}

	public keyPressed(key: KeyCode) {}

	public abstract getConfigDefinition(): ConfigTypesToDefinition<TConfig>;
	public abstract getKeysDefinition(): KeyDefinitions<TConfig>;
}
