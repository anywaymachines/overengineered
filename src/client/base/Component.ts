import ComponentBase from "./ComponentBase";
import ComponentContainer from "./ComponentContainer";

/** A component that controls an Instance and has children. */
export default class Component<
	T extends Instance = Instance,
	TChild extends ComponentBase = ComponentBase,
> extends ComponentContainer<TChild> {
	protected readonly instance: T;

	constructor(instance: T) {
		super();
		this.instance = instance;

		(this.instance as Instance).GetPropertyChangedSignal("Parent").Connect(() => {
			if (this.instance.Parent) return;
			this.destroy();
		});
	}

	/** Checks if the child exists on an Instance */
	protected static exists<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}

	/** Get an attribute value on the Instance */
	getAttribute<T extends AttributeValue>(name: string) {
		return this.instance.GetAttribute(name) as T | undefined;
	}

	getInstance() {
		return this.instance;
	}

	/** Add a child */
	add<T extends TChild>(instance: T) {
		super.add(instance);

		if (
			instance instanceof Component &&
			instance.getInstance() !== this.instance &&
			instance.getInstance().Parent === undefined
		) {
			instance.getInstance().Parent = this.instance;
		}

		return instance;
	}

	/** Disable component events, destroy the Instance and free the memory */
	destroy() {
		super.destroy();

		try {
			this.instance.Destroy();
		} catch {
			// empty
		}
	}
}
