import SlimSignal from "shared/event/SlimSignal";

/** Stores components. Handles its enabling, disabling and destroying. */
export class ComponentChildren<T extends IComponent = IComponent> implements IDebuggableComponent {
	private static readonly empty: [] = [];

	readonly onAdded = new SlimSignal<(child: T) => void>();
	readonly onRemoved = new SlimSignal<(child: T) => void>();
	readonly onClear = new SlimSignal();

	private readonly state: IComponent;
	private children?: T[];
	private clearing = false;

	constructor(state: IComponent, clearOnDisable = false) {
		this.state = state;

		state.onEnable(() => {
			if (!this.children) return;

			for (const child of this.children) {
				child.enable();
			}
		});
		state.onDestroy(() => this.clear());

		if (!clearOnDisable) {
			state.onDisable(() => {
				if (!this.children) return;

				for (const child of this.children) {
					child.disable();
				}
			});
		} else {
			state.onDisable(() => this.clear());
		}
	}

	getDebugChildren(): readonly T[] {
		return this.getAll();
	}

	getAll(): readonly T[] {
		return this.children ?? ComponentChildren.empty;
	}

	add<TChild extends T>(child: TChild): TChild {
		this.children ??= [];
		this.children.push(child);
		this.onAdded.Fire(child);

		if (this.state.isEnabled()) {
			child.enable();
		}

		child.onDestroy(() => {
			if (this.clearing) return;
			this.remove(child);
		});

		return child;
	}

	remove(child: T) {
		if (!this.children) return;

		const index = this.children.indexOf(child);
		if (index === -1) return;

		this.children.remove(index);
		this.onRemoved.Fire(child);
		child.destroy();
	}

	clear() {
		this.onClear.Fire();
		if (!this.children) return;

		this.clearing = true;
		for (const child of this.children) {
			this.onRemoved.Fire(child);
			child.destroy();
		}

		this.children.clear();
		this.clearing = false;
	}
}
