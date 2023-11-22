import Control from "client/base/Control";

/** A GUI element that has children, keyed by some value */
export class DictionaryControl<T extends GuiObject, TKey, TValue extends Control = Control> extends Control<T> {
	private readonly children = new Map<TKey, TValue>();

	constructor(gui: T) {
		super(gui);
	}

	/** Returns a list of added children */
	getChildren(): ReadonlyMap<TKey, TValue> {
		return this.children;
	}

	/** Add a child */
	add(key: TKey, child: TValue) {
		child.setParent(this.gui);
		this.children.set(key, child);
	}

	/** Remove a child */
	remove(key: TKey) {
		const child = this.children.get(key);
		if (!child) return;

		child.setParent(undefined);
		this.children.delete(key);
	}

	/** Clear all added children */
	clear() {
		this.children.forEach((child) => child.setParent(undefined));
		this.children.clear();
	}
}
