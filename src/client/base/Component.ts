import ComponentBase from "./ComponentBase";

/** A component that controls an Instance and has children. */
export default class Component<
	T extends Instance = Instance,
	TChild extends ComponentBase = ComponentBase,
> extends ComponentBase {
	private readonly children: TChild[] = [];
	protected readonly instance: T;

	constructor(instance: T) {
		super();
		this.instance = instance;
		this.event.onPrepare(() => this.prepare());
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
		this.instance.Parent = undefined;
	}

	/** Add a child and return it */
	protected added<T extends TChild>(instance: T, setParent = true) {
		this.add(instance, setParent);
		return instance;
	}

	/** Add a child */
	public add(instance: TChild, setParent = true) {
		this.children.push(instance);
		if (this.isEnabled()) instance.enable();
		if (setParent && instance instanceof Component) {
			instance.instance.Parent = this.instance;
		}
	}

	/** Remove a child */
	public remove(child: TChild, setParent = true) {
		const index = this.children.indexOf(child);
		if (index === -1) return;

		this.children.remove(index);
		if (setParent) {
			child.destroy();
		}
	}

	/**
	 * Clear all added children.
	 * Removes only children that have been added using this.add()
	 */
	public clear(setParents = true) {
		[...this.children].forEach((child) => this.remove(child, setParents));
	}
}
