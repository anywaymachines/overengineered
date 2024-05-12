import { ClientComponent } from "client/component/ClientComponent";
import { Signal } from "shared/event/Signal";

/*
	When a key is pressed, invoke keyDown()
	When a key is released, invoke keyUp()
*/
export class KeyPressingController<TKeys extends string> {
	readonly onKeyDown = new Signal<(key: TKeys) => void>();
	readonly onKeyUp = new Signal<(key: TKeys) => void>();
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
export class KeyPressingConflictingController<TKeys extends string> extends KeyPressingController<TKeys> {
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

export type KeyDefinition<TKeys extends string> = {
	key: KeyCode;
	keyDown?: () => void;
	keyUp?: () => void;
	conflicts?: TKeys;
};
export type KeyDefinitions<TKeys extends string> = { readonly [k in TKeys]: KeyDefinition<TKeys> };

export class KeyPressingDefinitionsController<T extends KeyDefinitions<string>> extends ClientComponent {
	readonly controller;

	constructor(definitions: T) {
		super();
		this.controller = new KeyPressingConflictingController<keyof T & string>(definitions);
		this.event.onDisable(() => this.controller.releaseAll());

		this.event.subscribe(this.controller.onKeyDown, (key) => {
			definitions[key]?.keyDown?.();
		});
		this.event.subscribe(this.controller.onKeyUp, (key) => {
			definitions[key]?.keyUp?.();
		});

		for (const [key, def] of pairs(definitions)) {
			this.event.onKeyDown(def.key, () => this.controller.keyDown(key as keyof T & string));
			this.event.onKeyUp(def.key, () => this.controller.keyUp(key as keyof T & string));
		}
	}
}
