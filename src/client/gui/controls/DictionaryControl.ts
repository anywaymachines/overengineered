import Control from "client/gui/Control";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { ComponentKeyedChildren } from "shared/component/ComponentKeyedChildren";
import { InstanceComponent } from "shared/component/InstanceComponent";

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
		this.keyedChildren.onAdded.Connect((_, child) => {
			if (child instanceof InstanceComponent && typeIs(child.instance, "Instance")) {
				ComponentInstance.setParentIfNeeded(child.instance, this.instance);
			}
		});
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...[...this.keyedChildren.getAll()].map((c) => c[1])];
	}
}
