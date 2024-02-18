import { ComponentChildren } from "./ComponentChildren";
import ComponentBase from "./SharedComponentBase";

/** Component with children */
export default class ContainerComponent<TChild extends IComponent = IComponent> extends ComponentBase {
	readonly children: ComponentChildren<TChild> = new ComponentChildren(this);

	/** Returns a list of added children */
	readonly getChildren = () => this.children.getAll();

	/** Add a child and return it
	 * @deprecated Use `add` instead
	 */
	readonly added = <T extends TChild>(instance: T) => this.add(instance);

	/** Add a child and return it */
	readonly add = <T extends TChild>(instance: T) => this.children.add(instance);

	/** Add a child and return this */
	readonly withAdded = (instance: TChild) => this.with((c) => c.add(instance));

	/** Remove and destroy a child */
	readonly remove = (child: TChild) => this.children.remove(child);

	/** Clear all added children. Removes only children that have been added using this.add() */
	readonly clear = () => this.children.clear();

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...this.children.getDebugChildren()];
	}
}
