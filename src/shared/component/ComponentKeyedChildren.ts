import { SlimSignal } from "shared/event/SlimSignal";

type Constraint = IComponent;

/** Stores keyed components. Handles its enabling, disabling and destroying. */
export class ComponentKeyedChildren<TKey extends defined, T extends Constraint = Constraint>
	implements IDebuggableComponent
{
	private static readonly empty: ReadonlyMap<defined, Constraint> = new Map<defined, Constraint>();
	private static readonly emptyarr: [] = [];

	readonly onAdded = new SlimSignal<(key: TKey, child: T) => void>();
	readonly onRemoved = new SlimSignal<(key: TKey, child: T) => void>();
	readonly onClear = new SlimSignal();

	private readonly state: IReadonlyComponent;
	private children?: Map<TKey, T>;
	private clearing = false;

	constructor(state: IReadonlyComponent, clearOnDisable = false) {
		this.state = state;

		state.onEnable(() => {
			if (!this.children) return;

			for (const [_, child] of this.children) {
				child.enable();
			}
		});
		state.onDestroy(() => this.clear());

		if (!clearOnDisable) {
			state.onDisable(() => {
				if (!this.children) return;

				for (const [_, child] of this.children) {
					child.disable();
				}
			});
		} else {
			state.onDisable(() => this.clear());
		}
	}

	getDebugChildren(): readonly T[] {
		if (!this.children) {
			return ComponentKeyedChildren.emptyarr;
		}

		return [...this.children].map((e) => e[1]);
	}

	getAll(): ReadonlyMap<TKey, T> {
		return this.children ?? (ComponentKeyedChildren.empty as ReadonlyMap<TKey, T>);
	}

	get(key: TKey): T | undefined {
		return this.children?.get(key);
	}

	add<TChild extends T>(key: TKey, child: TChild, throwIfExists = false): TChild {
		if (throwIfExists && this.children?.has(key)) {
			throw `Child with the key ${key} already exists`;
		}

		this.children ??= new Map();
		this.children.set(key, child);

		if (this.state.isEnabled()) {
			child.enable();
		}

		child.onDestroy(() => {
			if (this.clearing) return;
			this.remove(key);
		});

		this.onAdded.Fire(key, child);
		return child;
	}

	remove(key: TKey) {
		if (!this.children) return;

		const child = this.children.get(key);
		if (!child) return;

		this.children.delete(key);
		this.onRemoved.Fire(key, child);
		child.destroy();
	}

	clear() {
		this.onClear.Fire();
		if (!this.children) return;

		this.clearing = true;
		for (const [key, child] of this.children) {
			this.onRemoved.Fire(key, child);
			child.destroy();
		}

		this.children.clear();
		this.clearing = false;
	}
}
