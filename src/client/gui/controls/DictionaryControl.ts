import Control from "client/gui/Control";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";

/** Control that has its children keyed by some value */
export class DictionaryControl<
	T extends GuiObject,
	TKey extends string,
	TValue extends Control = Control,
> extends Control<T, TValue> {
	readonly keyedChildren = new ComponentKeyedChildren<TKey, TValue>(this);

	constructor(gui: T) {
		super(gui);
		this.children.onClear.Connect(() => this.keyedChildren.clear());
	}
}
