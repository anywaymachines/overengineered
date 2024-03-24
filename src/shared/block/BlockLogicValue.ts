import Signal from "shared/event/Signal";

export interface ReadonlyBlockLogicValue<T> {
	readonly changed: Signal<(value: T, prev: T) => void>;

	get(): T;
	subscribe(func: (value: T, prev: T) => void): void;
}
export interface IBlockLogicValue<T> extends ReadonlyBlockLogicValue<T> {
	set(value: T): void;
}

export class BlockLogicValue<T extends defined> implements IBlockLogicValue<T> {
	readonly changed = new Signal<(value: T, prev: T) => void>();
	readonly connections: BlockLogicValue<T>[] = [];
	private value: T;
	private nextValue: T | undefined;
	private processedAtLeastOnce = false;

	constructor(value: T) {
		this.value = value;
	}

	get(): T {
		return this.value;
	}
	set(value: T) {
		this.nextValue = this.processValue(value);
	}

	protected processValue(value: T): T {
		return value;
	}

	connectTo(value: BlockLogicValue<T>) {
		this.connections.push(value);
	}

	subscribe(func: (value: T, prev: T) => void): void {
		this.changed.Connect(func);
	}

	tick(tick: number): void {
		if (this.processedAtLeastOnce) {
			if (this.nextValue === undefined || this.nextValue === this.get()) {
				return;
			}
		} else {
			this.processedAtLeastOnce = true;
		}

		const prev = this.value;
		if (this.nextValue !== undefined) {
			this.value = this.nextValue;
			this.nextValue = undefined;
		}

		for (const connection of this.connections) {
			connection.set(this.value);
		}

		this.changed.Fire(this.value, prev);
	}
}
