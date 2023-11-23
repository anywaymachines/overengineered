import Control from "client/base/Control";

/** A GUI element that has children, keyed by some value */
export class DictionaryControl<T extends GuiObject, TKey, TValue extends Control = Control> extends Control<T> {
	private readonly keyedChildren = new Map<TKey, TValue>();

	constructor(gui: T) {
		super(gui);
	}

	/** Returns a list of added children */
	getKeyedChildren(): ReadonlyMap<TKey, TValue> {
		return this.keyedChildren;
	}

	/** Add a child */
	addKeyed(key: TKey, child: TValue, setParent = true) {
		this.keyedChildren.set(key, child);
		this.add(child, setParent);
	}

	/** Remove a child */
	removeKeyed(key: TKey, setParent = true) {
		const child = this.keyedChildren.get(key);
		if (!child) return;

		this.keyedChildren.delete(key);
		this.remove(child, setParent);
	}

	/** Clear all added children */
	clear(setParent = true) {
		this.keyedChildren.clear();
		super.clear(setParent);
	}
}
