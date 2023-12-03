import ComponentBase from "./ComponentBase";

/** A component that has children. */
export default class ComponentContainer<TChild extends ComponentBase = ComponentBase> extends ComponentBase {
	private readonly children: TChild[] = [];

	/** Checks if the child exists on an Instance */
	protected static exists<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}

	/** Returns a list of added children */
	public getChildren(): readonly TChild[] {
		return this.children;
	}

	/** Enable component events, for self and every child */
	public enable() {
		super.enable();

		for (const child of this.getChildren()) {
			child.enable();
		}
	}
	/** Disable component events, for self and every child */
	public disable() {
		for (const child of this.getChildren()) {
			child.disable();
		}

		super.disable();
	}
	/** Disable component events, destroy the Instance and free the memory, for self and every child */
	public destroy() {
		for (const child of this.getChildren()) {
			child.destroy();
		}

		super.destroy();
	}

	/** Add a child and return it */
	protected added<T extends TChild>(instance: T) {
		this.add(instance);
		return instance;
	}

	/** Add a child */
	public add(instance: TChild) {
		this.children.push(instance);
		if (this.isEnabled()) instance.enable();
	}

	/** Remove and destroy a child */
	public remove(child: TChild) {
		const index = this.children.indexOf(child);
		if (index === -1) return;

		this.children.remove(index);
		child.destroy();
	}

	/**
	 * Clear all added children.
	 * Removes only children that have been added using this.add()
	 */
	public clear() {
		[...this.children].forEach((child) => this.remove(child));
	}
}
