import { ComponentBase } from "shared/component/ComponentBase";
import { ComponentChild } from "shared/component/ComponentChild";
import { ComponentEvents } from "shared/component/ComponentEvents";
import type { Control } from "client/gui/Control";

/** Base of any component. Handles events and signals which can be enabled or disabled. */
export class Component extends ComponentBase implements IComponent, IDebuggableComponent {
	protected readonly event = this.parent(new ComponentEvents());
	protected readonly eventHandler = this.event.eventHandler;

	/**
	 * Return a function that returns a copy of the provided Instance. Destroys the Instance if specified.
	 * Leaks the memory, use only in static context.
	 */
	static asTemplateWithMemoryLeak<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}
	/** Return a function that returns a copy of the provided Instance; Destroys the original if specified */
	protected asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();
		this.onDestroy(() => template.Destroy());

		return () => template.Clone();
	}

	with(func: (tis: this) => void): this {
		func(this);
		return this;
	}
	readonly setEnabled = (enable: boolean) => (enable ? this.enable() : this.disable());

	private parented?: (IDebuggableComponent | object)[];

	/** Subscribe a child to this component state. Return the child. */
	protected parent<T extends IDebuggableComponent | IWriteonlyComponent>(child: T): T {
		this.parented ??= [];
		this.parented.push(child);

		if ("destroy" in child || child instanceof ComponentBase) {
			ComponentChild.init(this, child);
		}

		return child;
	}

	/** Equivalent of {@link parent} but shows/hides the provided {@link Control} */
	protected parentGui<T extends Control>(gui: T): T {
		this.onEnable(() => gui.show());
		this.onDisable(() => gui.hide());
		this.onDestroy(() => gui.destroy());

		if (this.isEnabled()) gui.show();
		return gui;
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return (this.parented?.filter((p) => "getDebugChildren" in p) as IDebuggableComponent[] | undefined) ?? [];
	}
}
