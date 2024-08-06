import { SlimSignal } from "shared/event/SlimSignal";

type Constraint = IWriteonlyComponent & IReadonlyDestroyableComponent;

export interface ReadonlyComponentChild<T extends Constraint = Constraint> {
	get(): T | undefined;
}

/** Stores a single component (or zero). Handles its enabling, disabling and destroying. */
export class ComponentChild<T extends Constraint = Constraint>
	implements ReadonlyComponentChild<T>, IDebuggableComponent
{
	readonly childSet = new SlimSignal<(child: T | undefined) => void>();

	private child?: T;

	/** Subscribe a child to a parent state. */
	static init(state: IReadonlyComponent, child: IWriteonlyComponent) {
		state.onEnable(() => child.enable());
		state.onDisable(() => child.disable());
		state.onDestroy(() => child.destroy());

		if (state.isEnabled()) child.enable();
	}
	constructor(
		private readonly state: (IReadonlyEnableableComponent & IReadonlyDestroyableComponent) | IReadonlyComponent,
		clearOnDisable = false,
	) {
		state.onEnable(() => this.child?.enable());
		state.onDestroy(() => this.clear());

		if ("onDisable" in state) {
			if (!clearOnDisable) {
				state.onDisable(() => this.child?.disable());
			} else {
				state.onDisable(() => this.clear());
			}
		}
	}

	getDebugChildren(): readonly T[] {
		return this.child ? [this.child] : [];
	}

	get() {
		return this.child;
	}

	set<TChild extends T | undefined>(child: TChild): TChild {
		const prev = this.child;
		this.child = child;
		prev?.destroy();
		this.childSet.Fire(child);

		if (child && this.child === child) {
			child.onDestroy(() => {
				if (this.child !== child) return;
				this.set(undefined);
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
