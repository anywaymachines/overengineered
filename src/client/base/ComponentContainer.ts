import ComponentBase from "./ComponentBase";

/** A component that has children. */
export default class ComponentContainer<TChild extends ComponentBase = ComponentBase> extends ComponentBase {
	private readonly children: TChild[] = [];

	/** Returns a list of added children */
	getChildren(): readonly TChild[] {
		return this.children;
	}

	/** Enable component events, for self and every child */
	enable() {
		super.enable();

		for (const child of this.getChildren()) {
			child.enable();
		}
	}
	/** Disable component events, for self and every child */
	disable() {
		for (const child of this.getChildren()) {
			child.disable();
		}

		super.disable();
	}
	/** Disable component events, destroy the Instance and free the memory, for self and every child */
	destroy() {
		for (const child of this.getChildren()) {
			child.destroy();
		}

		super.destroy();
	}

	/**
	 * Add a child and return it
	 * @deprecated Use `add` instead
	 */
	added<T extends TChild>(instance: T) {
		return this.add(instance);
	}

	/** Add a child and return it */
	add<T extends TChild>(instance: T) {
		this.children.push(instance);
		if (this.isEnabled()) {
			instance.enable();
		}

		return instance;
	}

	/** Remove and destroy a child */
	remove(child: TChild) {
		const index = this.children.indexOf(child);
		if (index === -1) return;

		this.children.remove(index);
		child.destroy();
	}

	/**
	 * Clear all added children.
	 * Removes only children that have been added using this.add()
	 */
	clear() {
		[...this.children].forEach((child) => this.remove(child));
	}
}
