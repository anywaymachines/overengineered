import SlimSignal from "shared/event/SlimSignal";

/** Stores a single component (or zero). Handles its enabling, disabling and destroying. */
export class ComponentChild<T extends IComponent = IComponent> implements IDebuggableComponent {
	readonly childSet = new SlimSignal<(child: T | undefined) => void>();

	private readonly state: IComponent;
	private child?: T;

	/** Subscribe a child to a parent state. */
	static init(state: IComponent, child: IComponent) {
		state.onEnable(() => child.enable());
		state.onDisable(() => child.disable());
		state.onDestroy(() => child.destroy());

		if (state.isEnabled()) child.enable();
	}
	constructor(state: IComponent, clearOnDisable = false) {
		this.state = state;

		state.onEnable(() => this.child?.enable());
		state.onDestroy(() => this.clear());

		if (!clearOnDisable) {
			state.onDisable(() => this.child?.disable());
		} else {
			state.onDisable(() => this.clear());
		}
	}

	getDebugChildren(): readonly T[] {
		return this.child ? [this.child] : [];
	}

	get() {
		return this.child;
	}

	set<TChild extends T | undefined>(child: TChild): TChild {
		this.child?.destroy();
		this.child = child;
		this.childSet.Fire(child);

		if (child) {
			child.onDestroy(() => {
				if (this.child !== child) return;
				this.child = undefined;
			});

			if (this.state.isEnabled()) {
				child.enable();
			}
		}

		return child;
	}
	clear() {
		this.set(undefined);
	}
}
