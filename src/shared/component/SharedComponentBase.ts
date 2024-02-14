import SlimSignal from "shared/event/SlimSignal";
import { ComponentEvents } from "./ComponentEvents";

class ComponentBaseBase implements IComponent {
	private readonly onEnabled = new SlimSignal();
	private readonly onDisabled = new SlimSignal();
	private readonly onDestroyed = new SlimSignal();

	private selfEnabled = false;
	private selfDisabled = false;

	isEnabled(): boolean {
		return this.selfEnabled;
	}
	isDestroyed(): boolean {
		return this.selfDisabled;
	}

	onEnable(func: () => void): void {
		this.onEnabled.Connect(func);
	}
	onDisable(func: () => void): void {
		this.onDisabled.Connect(func);
	}
	onDestroy(func: () => void): void {
		this.onDestroyed.Connect(func);
	}

	enable(): void {
		if (this.selfDisabled || this.selfEnabled) return;

		this.selfEnabled = true;
		this.onEnabled.Fire();
	}
	disable(): void {
		if (this.selfDisabled || !this.selfEnabled) return;

		this.selfEnabled = false;
		this.onDisabled.Fire();
	}
	destroy(): void {
		if (this.selfDisabled) return;

		this.disable();

		this.selfDisabled = true;
		this.onDestroyed.Fire();
	}
}

/** Base of any component. Handles events and signals which can be enabled or disabled. */
export default class ComponentBase extends ComponentBaseBase {
	protected readonly event = new ComponentEvents(this);
	protected readonly eventHandler = this.event.eventHandler;

	constructor() {
		super();
	}

	/** Return a function that returns a copy of the provided Instance; Destroys the Instance if specified */
	static asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}

	with(func: (tis: this) => void): this {
		func(this);
		return this;
	}
}
