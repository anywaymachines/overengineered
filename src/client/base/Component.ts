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
		this.instance.Destroying.Connect(() => this.destroy());
	}

	/** Checks if the child exists on an Instance */
	protected static exists<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}

	/** Get an attribute value on the Instance */
	public getAttribute<T extends AttributeValue>(name: string) {
		return this.instance.GetAttribute(name) as T | undefined;
	}

	public getInstance() {
		return this.instance;
	}

	/** Add a child */
	public add(instance: TChild) {
		super.add(instance);

		if (
			instance instanceof Component &&
			instance.getInstance() !== this.instance &&
			instance.getInstance().Parent === undefined
		) {
			instance.getInstance().Parent = this.instance;
		}
	}

	/** Disable component events, destroy the Instance and free the memory */
	public destroy() {
		super.destroy();

		try {
			this.instance.Parent = undefined;
		} catch {
			// empty
		}
	}
}
