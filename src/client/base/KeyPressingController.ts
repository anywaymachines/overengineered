import Signal from "@rbxts/signal";
import Objects from "shared/_fixes_/objects";
import ComponentBase from "./ComponentBase";

/*
	When a key is pressed, invoke keyDown()
	When a key is released, invoke keyUp()
*/
export default class KeyPressingController<TKeys extends KeyCode> {
	public readonly onKeyDown = new Signal<(key: TKeys) => void>();
	public readonly onKeyUp = new Signal<(key: TKeys) => void>();
	private readonly pressed: TKeys[] = [];

	isDown(key: TKeys) {
		return this.pressed.includes(key);
	}

	keyDown(key: TKeys) {
		if (this.isDown(key)) return;

		this.pressed.push(key);
		this.onKeyDown.Fire(key);
	}
	keyUp(key: TKeys) {
		if (!this.isDown(key)) return;

		this.pressed.remove(this.pressed.indexOf(key));
		this.onKeyUp.Fire(key);
	}

	releaseAll() {
		for (const pressed of this.pressed) {
			this.keyUp(pressed);
		}

		this.pressed.clear();
	}
}

/*
	When a key is pressed,
		if `def.conflicts` is not null,
		and `def.conflicts` key is pressed,
			invoke keyUp() on the conflicted key
		else
			super()
	
	When a key is released,
		if `def.conflicts` is not null,
		and `def.conflicts` key is pressed,
			invoke keyDown() on the conflicted key
		else
			super()
*/
export class KeyPressingConflictingController<TKeys extends KeyCode> extends KeyPressingController<TKeys> {
	private readonly definitions;
	private readonly holding: TKeys[] = [];

	constructor(definitions: Readonly<Partial<Record<TKeys, { readonly conflicts?: TKeys }>>>) {
		super();
		this.definitions = definitions;
	}

	keyDown(key: TKeys) {
		if (this.isDown(key)) return;

		const def = this.definitions[key];
		if (def?.conflicts !== undefined && this.isDown(def.conflicts)) {
			this.keyUp(def.conflicts);
			this.holding.push(key);
			this.holding.push(def.conflicts);

			return;
		}

		super.keyDown(key);
	}
	keyUp(key: TKeys) {
		if (!this.isDown(key) && !this.holding.includes(key)) return;

		const def = this.definitions[key];
		if (def?.conflicts !== undefined && this.holding.includes(def.conflicts)) {
			this.holding.remove(this.holding.indexOf(key));
			this.holding.remove(this.holding.indexOf(def.conflicts));
			this.keyDown(def.conflicts);
			return;
		}

		super.keyUp(key);
	}

	releaseAll() {
		this.holding.clear();
		super.releaseAll();
	}
}

type KeyDefinition<TKeys extends string> = {
	key: KeyCode;
	keyDown?: () => void;
	keyUp?: () => void;
	conflicts?: TKeys;
};
type KeyDefinitions<TKeys extends string> = { readonly [k in TKeys]: KeyDefinition<TKeys> };

export class KeyPressingDefinitionsController<T extends KeyDefinitions<string>> extends ComponentBase {
	private readonly controller;
	private readonly btnmap;

	constructor(definitions: T) {
		super();

		this.controller = new KeyPressingConflictingController(definitions);
		this.btnmap = new Map(Objects.entries(definitions).map((e) => [e[1].key, e[0]] as const));

		this.onDisabled.Connect(() => this.controller.releaseAll());

		this.event.subscribe(this.controller.onKeyDown, (key) => {
			definitions[this.btnmap.get(key)!]?.keyDown?.();
		});
		this.event.subscribe(this.controller.onKeyUp, (key) => {
			definitions[this.btnmap.get(key)!]?.keyUp?.();
		});

		this.event.onInputBegin((input) => {
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
			this.controller.keyDown(input.KeyCode.Name);
		});
		this.event.onInputEnd((input) => {
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
			this.controller.keyUp(input.KeyCode.Name);
		});
	}
}
