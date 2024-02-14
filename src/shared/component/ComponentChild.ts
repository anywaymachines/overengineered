/** Stores a single component (or zero). Handles its enabling, disabling and destroying. */
export class ComponentChild<T extends IComponent = IComponent> {
	private readonly state: IComponent;
	private child?: T;

	constructor(state: IComponent, clearingOnDisable = false) {
		this.state = state;

		state.onEnable(() => this.child?.enable());
		state.onDestroy(() => this.clear());

		if (!clearingOnDisable) {
			state.onDisable(() => this.child?.disable());
		} else {
			state.onDisable(() => this.clear());
		}
	}

	get() {
		return this.child;
	}

	set<TChild extends T>(child: TChild): TChild {
		this.clear();

		this.child = child;
		child.onDestroy(() => {
			if (this.child !== child) return;
			this.child = undefined;
		});

		if (this.state.isEnabled()) {
			child.enable();
		}
		return child;
	}
	clear() {
		this.child?.destroy();
		this.child = undefined;
	}
}
