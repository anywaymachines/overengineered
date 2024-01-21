import Control from "client/base/Control";

/** Control that has its children keyed by some value */
export class DictionaryControl<T extends GuiObject, TKey, TValue extends Control = Control> extends Control<T, TValue> {
	private readonly keyedChildren = new Map<TKey, TValue>();

	constructor(gui: T) {
		super(gui);
	}

	getChild(key: TKey): TValue | undefined {
		return this.keyedChildren.get(key);
	}

	/** Returns a list of added children */
	getKeyedChildren(): ReadonlyMap<TKey, TValue> {
		return this.keyedChildren;
	}

	/** Add a child */
	addKeyed(key: TKey, child: TValue) {
		this.keyedChildren.set(key, child);
		this.add(child);
	}

	/** Remove a child */
	removeKeyed(key: TKey) {
		const child = this.keyedChildren.get(key);
		if (!child) return;

		this.keyedChildren.delete(key);
		this.remove(child);
	}

	/** Clear all added children */
	clear() {
		this.keyedChildren.clear();
		super.clear();
	}
}
